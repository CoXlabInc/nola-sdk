'use babel';

import CreateProjectView from './create-project-view';
import ControlPanelView from './control-panel-view';
import UpdateLibraryView from './update-library-view';
import { CompositeDisposable } from 'atom';

export default {
  createProjectView: null,
  UpdateView: null,
  topPanel: null,
  subscriptions: null,
  topToolbarView: null,

  activate(state) {
    this.createProjectView = new CreateProjectView(state.nolaSdkViewState);
    this.controlPanelView = new ControlPanelView(state.nolaSdkViewState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:toggle': () => this.toggle(),
      'nola-sdk:createProject': () => this.createProject(),
      'nola-sdk:showControlPanel': () => this.showControlPanel(),
      'nola-sdk:updateSdk': () => this.libUpdate(),
      'nola-sdk:hideControlPanel': () => this.close(),
    }));

    this.libUpdate();
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

  toggle() {
    console.log('Toggle!!!!!!');
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

  showControlPanel() {
    console.log('showControlPanel');
    this.controlPanelView.show();
  },

  createProject() {
    console.log('CreateProject');
    this.createProjectView.show();
  },
};
