'use babel';

app = require('remote').app;
path = require('path');
fs = require('fs-extra');
https = require('https');
unzip = require('unzip');
os = require('os');
chmodr = require('chmodr');

export default class UpdateLibraryView {
  panel: null;
  updateList: null;
  statusText: null;
  btnDone: null;
  prog: null;
  index: null;
  writer: null;
  libVersions: null;

  constructor(updateList, serializedState) {
    this.updateList = updateList;
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

    this.libVersions = atom.config.get('nola-sdk.libVersions');
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

    const serverURL = 'https://noliter.coxlab.kr';
    const privateKey = atom.config.get('nola-sdk.privateKey');
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

    if (libNewVer == 'DELETE') {
      for (j = 0; j < newLibVersions.length; j++) {
        if (newLibVersions[j].libType == libType) {
          this.statusText.textContent = 'Deleting ' + libType + '...';
          console.log(this.statusText.textContent);
          newLibVersions.splice(j, 1);
          fs.removeSync(filePath + libType);
          this.statusText.textContent = 'Deleting ' + libType + 'is done.';

          this.progress.value += 2;
          if (this.progress.value == this.progress.max) {
            atom.config.set('nola-sdk.libVersions', newLibVersions);
            this.statusText.textContent = 'Update completed.';
            console.log(this.statusText.textContent);
          }
          break;
        }
      }
    } else {
      var extractPath = filePath;
      if (libType == 'builder') {
        fs.removeSync(filePath + 'include');
        fs.removeSync(filePath + 'make');
      } else {
        fs.removeSync(filePath + libType);
        extractPath += libType;
      }

      this.statusText.textContent = 'Downloading ' + libType + ' ...';
      console.log('GET ' + url + libType);
      this.writer = fs.createWriteStream(filePath + fileName);
      https.get(url + libType, (response) => {
        response.pipe(this.writer);
        this.writer.on('finish', () => {
          this.prog.value++;
          console.log('Extracting ' + this.updateList[this.index].libType);

          var zipFile = fs.createReadStream(filePath + fileName).pipe(unzip.Extract({
            path: extractPath,
          }));
          zipFile.on('close', () => {
            fs.unlink(filePath + fileName);

            if (libType == 'builder' && (os.platform() == 'linux' || os.platform() == 'darwin')) {
              chmodr.sync(installPath + path.sep + 'make', 0o755);
            }

            if (this.libVersions.length == 0) {
              this.libVersions.push({
                libName: libName,
                libType: libType,
                libVersion: libNewVer,
                libToolchain: libToolchain
              });

            } else {
              for (j = 0; j < this.libVersions.length; j++) {
                if (this.libVersions[j].libType == libType) {
                  this.libVersions[j].libVersion = libNewVer;
                  this.libVersions[j].libToolchain = libToolchain;
                  break;
                }
              }

              if (j >= this.libVersions.length) {
                this.libVersions.push({
                  libName: libName,
                  libType: libType,
                  libVersion: libNewVer,
                  libToolchain: libToolchain
                });
              }
            }

            this.index++;
            this.prog.value++;
            if (this.index >= this.updateList.length) {
              console.log('All finished!!');
              atom.config.set('nola-sdk.libVersions', this.libVersions);
              this.statusText.textContent = 'Update completed!';
              this.btnDone.disabled = false;
            } else {
              this.doUpdate();
            }
          });
        });
      });
    }
  }

  handleEvent(event) {
    if (event.target == this.btnDone && event.type == 'click') {
      this.panel.hide();
      this.destroy();
    }
  }
}
