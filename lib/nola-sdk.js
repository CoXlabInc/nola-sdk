'use babel';

import CreateProjectView from './create-project-view';
import ControlPanelView from './control-panel-view';
import UpdateLibraryView from './update-library-view';
import ToolchainDownloadView from './toolchain-download-view';
import { CompositeDisposable } from 'atom';

exports.hasToolchain = hasToolchain;
exports.notiDownloadToolchain = notiDownloadToolchain;
exports.doDownloadToolchain = doDownloadToolchain;

export default {
  createProjectView: null,
  UpdateView: null,
  topPanel: null,
  subscriptions: null,
  controlPanelView: null,

  activate(state) {
    this.controlPanelView = new ControlPanelView(state.nolaSdkViewState);
    this.createProjectView = new CreateProjectView(state.nolaSdkViewState, this.controlPanelView);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:toggle': () => this.toggle(),
      'nola-sdk:createProject': () => this.createProject(),
      'nola-sdk:openProject': () => this.openProject(),
      'nola-sdk:closeProject': () => this.closeProject(),
      'nola-sdk:showControlPanel': () => this.showControlPanel(),
      'nola-sdk:updateSdk': () => this.libUpdate(),
      'nola-sdk:hideControlPanel': () => this.close(),
    }));

    this.libUpdate();
    this.essentialToolsUpdate();
  },

  deactivate() {
    this.subscriptions.dispose();
    this.controlPanelView.destroy();
    this.createProjectView.destroy();
  },

  close() {
    this.controlPanelView.hide();
    this.createProjectView.hide();
  },

  serialize() {
    return {
      nolaSdkViewState: this.createProjectView.serialize()
    };
  },

  libUpdate() {
    const https = require('https');

    https.get('https://noliter.coxlab.kr/lib-latest-version', (res) => {
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
    this.controlPanelView.show();
  },

  createProject() {
    console.log('CreateProject');
    this.createProjectView.show();
  },

  openProject() {
    var dir = require('remote').dialog.showOpenDialog({
      properties:['openDirectory']
    });

    if (dir != undefined) {
      if (dir[0] == this.controlPanelView.currentProjectPath) {
        alert('This project is already opened.');
      } else {
        try {
          fs.statSync(dir[0] + path.sep + '.atom-build.json');
          this.controlPanelView.setProject(dir[0]);
        } catch(e) {
          alert('No project is found in this path.');
        }
      }
    }
  },

  closeProject() {
    this.controlPanelView.setProject(null);
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
