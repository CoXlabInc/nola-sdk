'use babel';

import { CompositeDisposable } from 'atom';
import { EventEmitter } from 'events';
import ControlPanelView from './control-panel-view';
import UpdateLibraryView from './update-library-view';
import ToolchainDownloadView from './toolchain-download-view';

const http = require('http');

exports.hasToolchain = hasToolchain;
exports.notiDownloadToolchain = notiDownloadToolchain;
exports.doDownloadToolchain = doDownloadToolchain;

export default {
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
      'nola-sdk:showControlPanel': () => this.showControlPanel(),
      'nola-sdk:updateSdk': () => this.libUpdate(),
      'nola-sdk:hideControlPanel': () => this.close(),
    }));

    this.libUpdate();
    this.essentialToolsUpdate();
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
    http.get('http://download.coxlab.kr/lib-latest-version.json', (res) => {
      res.on('data', (d) => {
        if (d == '-1') {
          atom.notifications.addInfo("Server Error. Please retry later.");
        } else if (d == '-2') {
          atom.notifications.addInfo("Private key is NOT valid.");
        } else {
          this.updateCheck(JSON.parse(d), true);
        }
      });
    }).on('error', (e) => {
      console.error(e);
    });
  },

  updateCheck(libInfo, feedback) {
    updateList = this._makeUpdateList(libInfo);
    if (updateList.length > 0) {
      updateInfoStr = "";

      for (i = 0; i < updateList.length; i++) {
        updateInfoStr += (i + 1) + ". " + updateList[i].libName;
        if (updateList[i].libOldVer == "NEW") {
          updateInfoStr += " [ New " + updateList[i].libNewVer;
        } else if (updateList[i].libNewVer == "DELETE") {
          updateInfoStr += " [ Delete " + updateList[i].libOldVer;
        } else {
          updateInfoStr += " [ " + updateList[i].libOldVer + " -> " + updateList[i].libNewVer;
        }

        updateInfoStr += " ]\n";
      }

      sdk = this;
      noti = atom.notifications.addInfo("Update for Nol.A SDK!",
                                        {
                                          dismissable: true,
                                          detail: updateInfoStr,
                                          buttons: [{
                                            text: 'Update',
                                            onDidClick() {
                                              noti.dismiss();
                                              updateView = new UpdateLibraryView(updateList);
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

        if (y == libInfo.length - 1) {
          // Found Deleted Library.
          updateList.push({
            libName: libVers[x].libName,
            libType: libVers[x].libType,
            libOldVer: libVers[x].libVersion,
            libNewVer: "DELETE"
          });
        }
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
    try {
      fs.statSync(app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + 'tools');
    } catch(e) {
      doDownloadToolchain({
        id: 'tools-0.23.0',
        dir: 'tools',
        path: '.'
      });
    }
  },

  showControlPanel() {
    console.log('showControlPanel');
    this.controlPanel.show();
  },

  openProject() {
    var dir = require('remote').dialog.showOpenDialog({
      properties:['openDirectory']
    });

    if (dir != undefined) {
      if (dir[0] == this.controlPanel.currentProjectPath) {
        alert('This project is already opened.');
      } else {
        var hasOldFile;
        try {
          fs.statSync(dir[0] + path.sep + '.atom-build.json');
          hasOldFile = true;
          console.log('The .atom-build.json exists.');
        } catch(e) {
          hasOldFile = false;
        }

        if (hasOldFile) {
          // Convert old file to new format.
          var data = fs.readFileSync(dir[0] + path.sep + '.atom-build.json');
          fs.unlink(dir[0] + path.sep + '.atom-build.json');
          var oldFormat = JSON.parse(data.toString());
          var newFormat = {
            'board': oldFormat.args[0],
          };

          fs.writeFileSync(dir[0] + path.sep + 'Nol.A-project.json', JSON.stringify(newFormat, null, ' '));
          this.controlPanel.setProject(dir[0]);

        } else {
          try {
            fs.statSync(dir[0] + path.sep + 'Nol.A-project.json');
            this.controlPanel.setProject(dir[0]);
          } catch(e) {
            alert('No project is found in this path.');
          }
        }
      }
    }
  },

  provideBuilder() {
    const gccErrorMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(fatal error|error):\\s*(?<message>.+)';
    const ocamlErrorMatch = '(?<file>[\\/0-9a-zA-Z\\._\\-]+)", line (?<line>\\d+), characters (?<col>\\d+)-(?<col_end>\\d+):\\n(?<message>.+)';
    const golangErrorMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):\\s*(?<message>.*error.+)';
    const errorMatch = [
      gccErrorMatch, ocamlErrorMatch, golangErrorMatch
    ];

    const gccWarningMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(warning):\\s*(?<message>.+)';
    const warningMatch = [
      gccWarningMatch
    ];

    var controlPanel = this.controlPanel;

    return class NolABuildProvider extends EventEmitter {
      constructor(cwd) {
        super();
        this.cwd = cwd;
        atom.config.observe('nola-sdk.build', () => this.emit('refresh'));
      }

      getNiceName() {
        return 'Nol.A Build';
      }

      isEligible() {
        if (this.cwd != controlPanel.currentProjectPath) {
          return false;
        }

        if (controlPanel.devSelectView.curDev == undefined) {
          return false;
        }

        try {
          fs.statSync(this.cwd + path.sep + 'Nol.A-project.json');
        } catch(e) {
          return false;
        }

        return true;
      }

      settings() {
        var config = {
          exec: app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + 'make' + path.sep + 'build',
          args: [],
          errorMatch: errorMatch,
          warningMatch: warningMatch,
        };

        if (os.platform() == 'linux' || os.platform() == 'darwin') {
          config.exec += '.sh';
        } else {
          config.exec += '.cmd';
        }

        config.args = [
          controlPanel.devSelectView.curDev.libType,
          controlPanel.portSelectView.curPort,
        ];

        console.log('settings:' + JSON.stringify(config));
        return config;
      }
    };
  }
};

function hasToolchain(toolchain) {
  toolChainList = atom.config.get('nola-sdk.toolchains');
  if (toolChainList == undefined) {
    toolChainList = [];
    atom.config.set('nola-sdk.toolchains', toolChainList);
  }

  for (i = 0; i < toolChainList.length; i++) {
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
