'use babel';

const http = require('https');
const fs = require('fs-extra');
const yazul = require('yauzl');
const Transform = require("stream").Transform;
const path = require('path');

export default class ToolchainDownloadView {
  myPanel: null;
  progBar: null;
  statusText: null;
  btnCancel: null;
  request: null;
  zipFile: null;
  targetToolchain: null;
  targetPath: null;

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

  doDownload(callback) {
    const installPath = app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + this.targetPath;
    fs.ensureDirSync(installPath);

    var url = 'https://download.coxlab.kr/tools/' + this.targetToolchain + '-';
    if (os.platform() == 'win32' || os.platform() == 'win64') {
      url += 'win.zip';
    } else {
      url += os.platform() + '.zip';
    }

    const toolchainZipFile = installPath + path.sep + 'temp.zip';
    fs.removeSync(toolchainZipFile);

    file = fs.createWriteStream(toolchainZipFile);
    //console.log('Request ' + url);
    this.request = http.get(url, (response) => {
      this.progBar.max = parseInt(response.headers['content-length'], 10);
      response.pipe(file);

      response.on('data', (chunk) => {
        //bad code for exception..
        if (chunk.toString() == '-2' || chunk.toString() == '-1') {
          alert("Server Error. Please retry later.");
          this.request.abort();
          if (typeof callback !== 'undefined') {
            callback(false);
          }
          return;
        }

        this.progBar.value += chunk.length;
        percent = parseInt(this.progBar.value * 100 / this.progBar.max);
        this.statusText.textContent = (
          'Downloading ' + percent + '% ('
          + parseInt(this.progBar.value / 1000) + '/'
          + parseInt(this.progBar.max / 1000) + ' KB)');
      });

      file.on('finish', () => {
        file.close();
        if (this.progBar.value != this.progBar.max) {
          this.statusText.textContent = 'Download has been canceled.';
          fs.unlink(toolchainZipFile);
          if (typeof callback !== 'undefined') {
            callback(false);
          }
        } else {
          this.statusText.textContent = 'Extracting... Please, wait seconds.';
          this.btnCancel.disabled = true;
          this.progBar.removeAttribute('value');

          yazul.open(toolchainZipFile, { lazyEntries: true }, (err, zipFile) => {
            if (err) {
              console.error(err);
              fs.unlink(toolchainZipFile);
              this.statusText.textContent = 'Opening package file error. Please, retry.';
              this.btnCancle.disabled = false;
              if (typeof callback !== 'undefined') {
                callback(false);
              }
              return;
            }

            // track when we've closed all our file handles
            var handleCount = 0;
            function incrementHandleCount() {
              handleCount++;
            }
            function decrementHandleCount() {
              handleCount--;
            }

            incrementHandleCount();
            zipFile.on("close", () => {
              decrementHandleCount();
              this.statusText.textContent = 'Completed';
              this.btnCancel.textContent = 'Close';
              this.btnCancel.disabled = false;
              this.request = null;
              this.progBar.value = this.progBar.max;

              let installedToolchains = atom.config.get('nola-sdk.toolchains');
              if (typeof installedToolchains === 'undefined') {
                installedToolchains = [];
              }
              installedToolchains.push(this.targetToolchain);
              atom.config.set('nola-sdk.toolchains', installedToolchains);

              if (typeof callback !== 'undefined') {
                callback(true);
              }

              fs.unlink(toolchainZipFile);
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
        if (typeof callback !== 'undefined') {
          callback(false);
        }
      });
    });
  }
}
