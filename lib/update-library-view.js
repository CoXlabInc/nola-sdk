'use babel';

app = require('remote').app;
path = require('path');
fs = require('fs-extra');
http = require('https');
yazul = require('yauzl');
Transform = require("stream").Transform;
os = require('os');

export default class UpdateLibraryView {
  panel: null;
  updateList: null;
  statusText: null;
  btnDone: null;
  prog: null;
  index: null;
  writer: null;
  libVersions: null;
  controlPanel: null;

  constructor(updateList, controlPanel, serializedState) {
    this.updateList = updateList;
    this.controlPanel = controlPanel;
    this.index = 0;

    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');

    const title = document.createElement('h1');
    title.textContent = 'Updating libraries...';
    title.classList.add('icon');
    title.classList.add('icon-desktop-download');
    this.element.appendChild(title);

    this.prog = document.createElement('progress');
    this.prog.classList.add('inline-block');
    this.prog.classList.add('width-full');
    this.prog.max = updateList.length * 2;
    this.prog.value = 0;

    this.element.appendChild(this.prog);

    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Ready';
    this.element.appendChild(this.statusText);

    const divBtn = document.createElement('div');
    divBtn.classList.add('align-center');

    this.btnDone = document.createElement('button');
    this.btnDone.textContent = 'Done';
    this.btnDone.disabled = true;
    this.btnDone.classList.add('btn');
    this.btnDone.classList.add('btn-size15');
    this.btnDone.classList.add('align-center');
    this.btnDone.addEventListener('click', this);

    this.element.appendChild(divBtn);
    divBtn.appendChild(this.btnDone);

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: true,
    });

    this.libVersions = [];
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  doUpdate() {
    const installPath = app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk';
    fs.ensureDirSync(installPath);

    const serverURL = 'https://download.coxlab.kr';
    const privateKey = atom.config.get('nola-sdk.orgKey');
    const filePath = installPath + path.sep;

    var url = serverURL + '/lib-download/';
    if (privateKey != undefined && privateKey != '') {
      url += privateKey + '/';
    }

    libName = this.updateList[this.index].libName;
    libType = this.updateList[this.index].libType;
    libNewVer = this.updateList[this.index].libNewVer;
    libToolchain = this.updateList[this.index].libToolchain;
    const fileName = libType + ".zip";

    var extractPath = filePath;
    if (libType == 'builder') {
      fs.removeSync(filePath + 'include');
      fs.removeSync(filePath + 'make');
    } else {
      fs.removeSync(filePath + libType);
      extractPath += libType;
    }

    this.statusText.textContent = 'Downloading ' + libName + ' ...';
    url += libType + '.zip';
    this.writer = fs.createWriteStream(filePath + fileName);
    http.get(url, (response) => {
      response.pipe(this.writer);
      this.writer.on('finish', () => {
        this.prog.value++;
        var view = this;

        yazul.open(filePath + fileName, { lazyEntries: true }, (err, zipFile) => {
          if (err) console.log(err);

          // track when we've closed all our file handles
          var handleCount = 0;
          function incrementHandleCount() {
            handleCount++;
          }
          function decrementHandleCount() {
            handleCount--;
            // if (handleCount === 0) {
            //   console.log("all input and output handles closed");
            // }
          }

          incrementHandleCount();
          zipFile.on("close", () => {
            decrementHandleCount();

            view.libVersions.push({
              libName: libName,
              libType: libType,
              libVersion: libNewVer,
              libToolchain: libToolchain
            });

            view.index++;
            view.prog.value++;

            fs.remove(filePath + fileName);

            if (view.index >= view.updateList.length) {
              view.finishUpdate();
            } else {
              view.doUpdate();
            }
          });

          zipFile.readEntry();
          zipFile.on("entry", (entry) => {
            if (/\/$/.test(entry.fileName)) {
              // directory file names end with '/'
              fs.mkdir(filePath + entry.fileName, (err) => {
                if (err && err.code !== 'EEXIST') throw err;
                zipFile.readEntry();
              });
            } else {
              // ensure parent directory exists
              fs.ensureDir(path.dirname(extractPath + path.sep + entry.fileName), (err) => {
                if (err) console.log(err);
                zipFile.openReadStream(entry, (err, readStream) => {
                  if (err) throw err;

                  var filter = new Transform();
                  filter._transform = function(chunk, encoding, cb) {
                    cb(null, chunk);
                  };
                  filter._flush = function(cb) {
                    cb();
                    zipFile.readEntry();
                  };

                  // pump file contents
                  var writeStream = fs.createWriteStream(extractPath + path.sep + entry.fileName);
                  incrementHandleCount();

                  writeStream.on("close", () => {
                    decrementHandleCount();

                    if (libType == 'builder' && (os.platform() == 'linux' || os.platform() == 'darwin')) {
                      fs.chmod(extractPath + path.sep + entry.fileName, 0o755);
                    }
                  });
                  readStream.pipe(filter).pipe(writeStream);
                });
              });
            }
          });
        });
      });
    });
  }

  finishUpdate() {
    atom.config.set('nola-sdk.libVersions', this.libVersions);

    this.statusText.textContent = 'Update completed!';
    this.btnDone.disabled = false;
    this.controlPanel.devSelectView.loadDevice();
    this.controlPanel.textDevLibVer.textContent = this.libVersions.find((element) => {
      return (element.libType == "builder");
    }).libVersion;
  }

  handleEvent(event) {
    if (event.target == this.btnDone && event.type == 'click') {
      this.panel.hide();
      this.destroy();
    }
  }
}
