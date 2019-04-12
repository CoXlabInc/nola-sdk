'use babel';

import { CompositeDisposable } from 'atom';
import { EventEmitter } from 'events';
import ControlPanelView from './control-panel-view';
import UpdateLibraryView from './update-library-view';
import ToolchainDownloadView from './toolchain-download-view';

const http = require('http');
const fs = require('fs-extra');
const verNewTool = 'tools-1.2.0';

exports.hasToolchain = hasToolchain;
exports.notiDownloadToolchain = notiDownloadToolchain;
exports.doDownloadToolchain = doDownloadToolchain;

export default {
  config: require('./config'),

  subscriptions: null,
  controlPanel: null,

  activate(state) {
    this.controlPanel = new ControlPanelView(state.nolaSdkViewState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:toggle': () => this.toggle(),
      'nola-sdk:openProject': () => this.openProject(),
      'nola-sdk:openProjectFromTree': (event) => {
        var filePath = document.querySelector('.tree-view .selected').getPath();
        var dir;
        try {
          var stats = fs.statSync(filePath);
          if (stats.isFile()) {
            dir = path.dirname(filePath);
          } else {
            dir = filePath;
          }
        } catch(exception) {
          alert('The file you pointed is not valid.\n' + exception);
          return;
        }

        this.openProject(dir);
      },
      'nola-sdk:showControlPanel': () => this.showControlPanel(),
      'nola-sdk:updateSdk': () => this.libUpdate(),
      'nola-sdk:settings': () => atom.workspace.open('atom://config/packages/nola-sdk'),
      'nola-sdk:hideControlPanel': () => this.close(),
      'nola-sdk:copyrightNotice': () => this.openCopyrightNotice()
    }));

    let toolchainList = atom.config.get('nola-sdk.toolchains');
    if (toolchainList != undefined && toolchainList.length > 0 && toolchainList[0].name != undefined) {
      console.log('Old toolchain list exists.');
      let newList = [];
      for (i in toolchainList) {
        newList.push(toolchainList[i].name);
        // console.log('tool:' + toolchainList[i].name);
      }
      // console.log('new list:' + newList);
      atom.config.set('nola-sdk.toolchains', newList);
    }
    this.libUpdate();
    this.essentialToolsUpdate();

    atom.config.unset('nola-sdk.build'); //remove old config value.

    require('atom-package-deps').install('nola-sdk');
  },

  deactivate() {
    this.subscriptions.dispose();
    this.controlPanel.destroy();
  },

  close() {
    this.controlPanel.hide();
  },

  serialize() {
  },

  libUpdate() {
    try {
      fs.statSync(app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk');
    } catch(e) {
      atom.config.set('nola-sdk.libVersions', []);
    }

    var url = 'http://download.coxlab.kr/lib-latest-version';

    var key = atom.config.get('nola-sdk.orgKey');
    if (key != '') {
      url += '-' + key;
    }
    url += '.json';

    http.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];

      let err;
      if (statusCode !== 200) {
        err = new Error(`Request failed. (Status code: ${statusCode})`);
      } else if (!/^application\/json/.test(contentType)) {
        err = new Error(`Invalid content-type. Expected JSON but received ${contentType}`);
      }

      if (err) {
        if (key != '') {
          atom.notifications.addWarning("Invalid organization key!", {
            detail: `You entered '${key}'. Check it again.`,
          });
        } else {
          console.error(err);
        }
        res.resume();
        return;
      }

      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        let parsedData = '';
        try {
          parsedData = JSON.parse(rawData);
          this.updateCheck(parsedData, true);
        } catch(e) {
          console.error(e);
        }
      });
    }).on('error', (e) => {
      console.error(e);
    });
  },

  updateCheck(libInfo, feedback) {
    updateList = this._makeUpdateList(libInfo);

    var updatedInfoStr;

    try {
      updatedInfoStr = `${libInfo.find((element) => {
        return (element.libType == "builder");
      }).libVersion}\n`;
    } catch(e) {
      console.error(e);
      console.error("builder element is missing");
      return;
    }

    if (updateList.length > 0) {
      for (i = 0; i < updateList.length; i++) {
        if (updateList[i].libOldVer == "NEW" && updateList[i].libType != "builder") {
          if (updatedInfoStr.length == 0) {
            updatedInfoStr = "New devices:\n";
          }

          updatedInfoStr += ` - ${updateList[i].libName}\n`;
        }
      }

      sdk = this;
      noti = atom.notifications.addInfo(
        "Update for Nol.A SDK!", {
          dismissable: true,
          detail: updatedInfoStr,
          buttons: [{
            text: 'Update',
            onDidClick() {
              noti.dismiss();
              updateView = new UpdateLibraryView(updateList, sdk.controlPanel);
              updateView.doUpdate();
            },
          }],
        });
    } else {
      if (feedback == true) {
        atom.notifications.addInfo("You already have the latest version of Nol.A SDK!");
      }
    }
  },

  _makeUpdateList(libInfo) {
    libVers = atom.config.get('nola-sdk.libVersions');

    if (libVers == undefined) {
      atom.config.set('nola-sdk.libVersions', []);
      libVers = atom.config.get('nola-sdk.libVersions');
    }

    updateList = [];

    for (x = 0; x < libVers.length; x++) {
      for (y = 0; y < libInfo.length; y++) {
        if (libVers[x].libType == libInfo[y].libType) {
          if (libVers[x].libVersion != libInfo[y].libVersion) {
            // Found new version of existing library.
            updateList.push({
              libName: libInfo[y].libName,
              libType: libInfo[y].libType,
              libOldVer: libVers[x].libVersion,
              libNewVer: libInfo[y].libVersion,
              libToolchain : libInfo[y].libToolchain
            });
          }
          break;
        }
      }

      if (y >= libInfo.length) {
        // Found a library to be deleted.
        const filePath = app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + libVers[x].libType;
        fs.remove(filePath, (err) => {
          if (err) {
            return console.error(err);
          }
        });
      }
    }

    for (x = 0; x < libInfo.length; x++) {
      // Found new libraries
      if (libVers.length == 0) {
        updateList.push({
          libName: libInfo[x].libName,
          libType: libInfo[x].libType,
          libOldVer: "NEW",
          libNewVer: libInfo[x].libVersion,
          libToolchain : libInfo[x].libToolchain
        });
      } else {
        for (y = 0; y < libVers.length; y++) {
          if (libInfo[x].libType == libVers[y].libType) {
            break;
          }

          if (y == libVers.length - 1) {
            updateList.push({
              libName: libInfo[x].libName,
              libType: libInfo[x].libType,
              libOldVer: "NEW",
              libNewVer: libInfo[x].libVersion,
              libToolchain : libInfo[x].libToolchain
            });
          }
        }
      }
    }
    return updateList;
  },

  essentialToolsUpdate() {
    const toolsDir = app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + 'tools';
    try {
      fs.statSync(toolsDir);
    } catch(e) {
      atom.config.set('nola-sdk.toolchains', []);
      doDownloadToolchain({
        id: verNewTool,
        dir: 'tools',
        path: '.'
      });
      return;
    }

    let toolchainList = atom.config.get('nola-sdk.toolchains');
    let needToUpdate = true;
    for (i in toolchainList) {
      if (toolchainList[i] == verNewTool) {
        needToUpdate = false;
      }
    }

    if (needToUpdate) {
      // console.log('Remove ' + toolsDir);
      fs.remove(toolsDir, err => {
        if (err) return console.error(err);

        atom.config.set('nola-sdk.toolchains', []);
        console.log(`new tool ver:${verNewTool}`);
        doDownloadToolchain({
          id: verNewTool,
          dir: 'tools',
          path: '.'
        });
      });
    }
  },

  showControlPanel() {
    this.controlPanel.show();
  },

  openProject(filePath) {
    var dir;
    if (filePath == undefined) {
      var nola = this;
      var remote = require('remote');

      remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
          properties:['openDirectory']
        },
        (filePaths) => {
          if (filePaths != undefined) {
            nola.openProject(filePaths[0])
          }
        }
      );
      return;
    } else {
      dir = filePath;
    }

    if (dir != undefined) {
      if (dir == this.controlPanel.currentProjectPath) {
        alert('This project is already opened.');
      } else {
        var hasOldFile;
        try {
          fs.statSync(dir + path.sep + '.atom-build.json');
          hasOldFile = true;
        } catch(e) {
          hasOldFile = false;
        }

        if (hasOldFile) {
          // Convert old file to new format.
          var data = fs.readFileSync(dir + path.sep + '.atom-build.json');
          fs.unlink(dir + path.sep + '.atom-build.json');
          var oldFormat = JSON.parse(data.toString());
          var newFormat = {
            'board': oldFormat.args[0],
          };

          fs.writeFileSync(dir + path.sep + 'Nol.A-project.json', JSON.stringify(newFormat, null, ' '));
        } else {
          try {
            fs.statSync(dir + path.sep + 'Nol.A-project.json');
          } catch(e) {
            alert('No project is found in this path:\n' + dir);
            return;
          }
        }

        this.controlPanel.setProject(dir);
      }
    }
  },

  provideBuilder() {
    const gccErrorMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(fatal error|error):\\s*(?<message>.+)';
    const errorMatch = [
      gccErrorMatch
    ];

    const gccWarningMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(warning):\\s*(?<message>.+)';
    const warningMatch = [
      gccWarningMatch
    ];

    var controlPanel = this.controlPanel;

    return class NolABuildProvider {
      constructor(cwd) {
        this.cwd = cwd;
      }

      getNiceName() {
        return 'Nol.A';
      }

      isEligible() {
        try {
          fs.statSync(this.cwd + path.sep + 'Nol.A-project.json');
        } catch(e) {
          return false;
        }

        return true;
      }

      settings() {
        var config = {
          exec: 'node',
          args: [
            'build.js',
            this.cwd
          ],
          errorMatch: errorMatch,
          warningMatch: warningMatch,
          name: 'Nol.A',
          cwd: [
            app.getPath('home'),
            '.atom',
            'nola-sdk',
            'make'
          ].join(path.sep),
          env: process.env
        };

        return config;
      }
    };
  },

  openCopyrightNotice() {
    shell = require('shell');
    shell.openExternal('http://www.coxlab.kr/docs/copyright-notice/');
  }
};

function hasToolchain(toolchain) {
  toolChainList = atom.config.get('nola-sdk.toolchains');
  if (toolChainList == undefined) {
    toolChainList = [];
    atom.config.set('nola-sdk.toolchains', toolChainList);
  }

  for (var i in toolChainList) {
    if (toolChainList[i] == toolchain)
      return true;
  }
  return false;
}

function notiDownloadToolchain(info) {
  noti = atom.notifications.addInfo("Additional tool is required!", {
    dismissable: true,
    detail: info.id,
    buttons: [{
      text: 'Download',
      className: 'btn-downloadDo',
      onDidClick() {
        noti.dismiss();
        doDownloadToolchain(info);
      }
    }]
  });
}

function doDownloadToolchain(toolInfo) {
  toolchainDownloadView = new ToolchainDownloadView(toolInfo);
  downloadPanel = atom.workspace.addModalPanel({
    item: toolchainDownloadView.element,
    visible: true
  });
  toolchainDownloadView.setPanel(downloadPanel);
  toolchainDownloadView.doDownload();
}
