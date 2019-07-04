'use babel';

http = require('http');
fs = require('fs-extra');
yazul = require('yauzl');
Transform = require("stream").Transform;
path = require('path');

export default class ToolchainDownloadView {
  myPanel: null;
  progBar: null;
  statusText: null;
  btnCancel: null;
  request: null;
  zipFile: null;
  targetToolchain: null;
  targetPath: null;
  totalSize: null;
  downloaded: 0;

  constructor(target, serializedState) {
    this.targetToolchain = target.id;
    this.targetPath = target.path;

    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');

    const title = document.createElement('h1');
    title.textContent = 'Installing \'' + this.targetToolchain + '\'...';
    title.classList.add('icon');
    title.classList.add('icon-desktop-download');
    this.element.appendChild(title);

    this.progBar = document.createElement('progress');
    this.progBar.classList.add('inline-block');
    this.progBar.classList.add('width-full');
    this.progBar.max = 100;
    this.progBar.value = 0;
    this.element.appendChild(this.progBar);

    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Ready';
    this.element.appendChild(this.statusText);

    const divBtn = document.createElement('div');
    divBtn.classList.add('align-center');

    this.btnCancel = document.createElement('button');
    this.btnCancel.textContent = 'Cancel';
    this.btnCancel.classList.add('btn');
    this.btnCancel.classList.add('btn-size15');
    this.btnCancel.classList.add('align-center');
    this.btnCancel.addEventListener('click', this);
    divBtn.appendChild(this.btnCancel);
    this.element.appendChild(divBtn);
  }

  serialize() {}

  handleEvent(event) {
    if (event.target == this.btnCancel && event.type == 'click') {
      if (this.myPanel != undefined) {
        this.myPanel.hide();
      }

      if (this.request != undefined) {
        this.request.abort();
        alert('The \'' + this.targetToolchain + '\' is required to build and flash your project. Please, update library if you want to re-download this tool.');
      }
    }
  }

  destroy() {
    this.element.remove();
  }

  setPanel(panel) {
    this.myPanel = panel;
  }

  doDownload() {
    const installPath = app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + this.targetPath;
    fs.ensureDirSync(installPath);

    var url = 'http://download.coxlab.kr/tools/' + this.targetToolchain + '-';
    if (os.platform() == 'win32' || os.platform() == 'win64') {
      url += 'win.zip';
    } else {
      url += os.platform() + '.zip';
    }

    const toolchainZipFile = installPath + path.sep + 'temp.zip';
    fs.removeSync(toolchainZipFile);
    this.downloaded = 0;

    var view = this;

    file = fs.createWriteStream(toolchainZipFile);
    //console.log('Request ' + url);
    this.request = http.get(url, (response) => {
      this.totalSize = parseInt(response.headers['content-length'], 10);
      //console.log('content-length:' + this.totalSize);
      response.pipe(file);

      response.on('data', (chunk) => {
        //bad code for exception..
        if (chunk.toString() == '-2' || chunk.toString() == '-1') {
          alert("Server Error. Please retry later.");
          this.request.abort();
          return;
        }

        this.downloaded += chunk.length;
        percent = parseInt(this.downloaded * 100 / this.totalSize);
        this.statusText.textContent = (
          'Downloading ' + percent + '% ('
          + parseInt(this.downloaded / 1000) + '/'
          + parseInt(this.totalSize / 1000) + ' KB)');
        this.progBar.value = parseInt(percent);
      });

      file.on('finish', () => {
        file.close();
        if (this.totalSize != this.downloaded) {
          this.statusText.textContent = 'Download has been canceled.';
          fs.unlink(toolchainZipFile);
        } else {
          this.statusText.textContent = 'Extracting... Please, wait seconds.';
          this.btnCancel.disabled = true;

          yazul.open(toolchainZipFile, { lazyEntries: true }, (err, zipFile) => {
            if (err) {
              console.error(err);
              fs.unlink(toolchainZipFile);
              this.statusText.textContent = 'Opening package file error. Please, retry.';
              this.btnCancle.disabled = false;
              return;
            }

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
            zipFile.on("close", function() {
              decrementHandleCount();
              // console.log("close " + toolchainZipFile);

              view.statusText.textContent = 'Completed';
              view.btnCancel.textContent = 'Close';
              view.btnCancel.disabled = false;
              view.request = null;

              let installedToolchains = atom.config.get('nola-sdk.toolchains');
              if (installedToolchains == undefined) {
                installedToolchains = [];
              }
              installedToolchains.push(view.targetToolchain);
              atom.config.set('nola-sdk.toolchains', installedToolchains);
            });

            zipFile.readEntry();
            zipFile.on("entry", (entry) => {
              if (/\/$/.test(entry.fileName)) {
                // directory file names end with '/'
                fs.ensureDir(installPath + path.sep + entry.fileName, (err) => {
                  if (err && err.code !== 'EEXIST') throw err;
                  zipFile.readEntry();
                });
              } else {
                // ensure parent directory exists
                fs.ensureDir(path.dirname(installPath + path.sep + entry.fileName), (err) => {
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
                    var writeStream = fs.createWriteStream(installPath + path.sep + entry.fileName);
                    incrementHandleCount();

                    writeStream.on("close", () => {
                      decrementHandleCount();
                      if (os.platform() == 'linux' || os.platform() == 'darwin') {
                        fs.chmod(installPath + path.sep + entry.fileName, 0o755);
                      }
                    });
                    readStream.pipe(filter).pipe(writeStream);
                  });
                });
              }
            });
          });
        }
      });

      file.on('error', () => {
        alert('Download has been failed. Please retry again.');
      });
    });
  }
}
