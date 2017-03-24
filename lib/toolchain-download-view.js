'use babel';

http = require('http');
fs = require('fs-extra');
unzip = require('unzip');
path = require('path');
chmodr = require('chmodr');

export default class ToolchainDownloadView {
  myPanel: null;
  progBar: null;
  statusText: null;
  btnCancel: null;
  request: null;
  zipFile: null;
  targetToolchain: null;
  targetDir: null;
  targetPath: null;
  totalSize: null;
  downloaded: 0;

  constructor(target, serializedState) {
    this.targetToolchain = target.id;
    if (target.dir == undefined) {
      this.targetDir = target.id;
    } else {
      this.targetDir = target.dir;
    }
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

    const filePath = installPath + path.sep + 'temp.zip';
    fs.removeSync(filePath);
    this.downloaded = 0;

    file = fs.createWriteStream(filePath);
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
          fs.unlink(filePath);
        } else {
          this.statusText.textContent = 'Extracting... Please, wait seconds.';
          this.btnCancel.disabled = true;
          this.zipFile = fs.createReadStream(filePath).pipe(unzip.Extract({
            path: installPath
          }));

          this.zipFile.on('close', () => {
            fs.unlink(filePath);
            if (os.platform() == 'linux' || os.platform() == 'darwin') {
              chmodr.sync(installPath + path.sep + this.targetDir, 0o755);
            }

            this.statusText.textContent = 'Completed';
            this.btnCancel.textContent = 'Close';
            this.btnCancel.disabled = false;
            this.request = null;

            installedToolchains = atom.config.get('nola-sdk.toolchains');
            if (installedToolchains == undefined) {
              installedToolchains = [];
            }
            installedToolchains.push({
              name: this.targetToolchain
            });
            atom.config.set('nola-sdk.toolchains', installedToolchains);
          });
        }
      });

      file.on('error', () => {
        alert('Download has been failed. Please retry again.');
      });

    });
  }
}
