'use babel';

import { CompositeDisposable } from 'atom';
import { SelectListView } from 'atom-space-pen-views';

var nola = require('./nola-sdk.js');

export default class DeviceSelectView extends SelectListView {
  panel: null;
  deviceList: [];
  curDev: null;
  controlPanel: null;

  constructor(serializedState, controlPanel) {
    super(serializedState);
    this.controlPanel = controlPanel;
    this.addClass('grammer-selector');
    this.list.addClass('mark-active');

    this.refreshDevList();
    if (controlPanel.currentProjectPath != undefined) {
      this.loadDevice();
    }

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:checkToolchain': () => this.checkToolchain()
    }));
  }

  destroy() {
    this.cancel();
  }

  viewForItem(dev) {
    element = document.createElement('li');
    if (dev == this.curDev) {
      element.classList.add('active');
    }
    element.textContent = dev.libName;
    return element;
  }

  getFilterKey() {
    return 'libName';
  }

  cancelled() {
    if (this.panel != undefined) {
      this.panel.destroy();
    }
    this.panel = null;
    this.editor = null;
  }

  confirmed(dev) {
    if (this.selectDev(dev) == false) {
      return;
    }

    this.curDev = dev;
    this.controlPanel.btnDevSelect.textContent = ' ' + dev.libName;
    this.controlPanel.textDevLibVer.textContent = dev.libVersion;
    this.cancel();
    this.controlPanel.refreshBuild();
  }

  attach() {
    this.storeFocusedElement();
    if (this.panel == undefined) {
      this.panel = atom.workspace.addModalPanel({
        item: this
      });
    }
    this.focusFilterEditor();
  }

  toggle() {
    if (this.panel == undefined) {
      this.refreshDevList();
      this.setItems(this.deviceList);
      this.attach();
    } else {
      this.cancel();
    }
  }

  refreshDevList() {
    this.deviceList = atom.config.get('nola-sdk.libVersions');
    if (this.deviceList == undefined) {
      this.deviceList = [];
      atom.config.set('nola-sdk.libVersions', this.deviceList);
    }

    for (i = 0; i < this.deviceList.length; i++) {
      if (this.deviceList[i].libType == 'builder') {
        this.deviceList.splice(i, 1);
        break;
      }
    }

    this.deviceList.sort(function(a, b) {
      var nameA = a.libName.toUpperCase();
      var nameB = b.libName.toUpperCase();
      if (nameA < nameB) {
        return -1;
      } else if (nameA > nameB) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  loadDevice() {
    f = this.controlPanel.currentProjectPath + path.sep + 'Nol.A-project.json';
    try {
      p = JSON.parse(fs.readFileSync(f).toString());
      if (p.board != undefined) {
        this.curDev = this.getDeviceByType(p.board);
        this.populateList();
        if (this.curDev != null) {
          this.controlPanel.btnDevSelect.textContent = ' ' + this.curDev.libName;
          this.controlPanel.textDevLibVer.textContent = this.curDev.libVersion;
          this.checkToolchain();
        } else {
          this.controlPanel.btnDevSelect.textContent = ' Not supported device';
          this.controlPanel.textDevLibVer.textContent = '';
        }
      } else {
        this.controlPanel.btnDevSelect.textContent = ' Select your device.';
        this.controlPanel.textDevLibVer.textContent = '';
      }
    } catch (e) {
      alert('Error: invalid project.' + e);
    }
  }

  clearDevice() {
    this.curDev = null;
    this.populateList();
    this.controlPanel.btnDevSelect.textContent = ' Select your device.';
  }

  selectDev(device) {
    f = this.controlPanel.currentProjectPath + path.sep + 'Nol.A-project.json';

    try {
      p = JSON.parse(fs.readFileSync(f).toString());
      p.board = device.libType;
      fs.writeFileSync(f, JSON.stringify(p, null, ' '));
    } catch (e) {
      alert ('Error : accessing project information failure.');
      return false;
    }

    if (nola.hasToolchain(device.libToolchain) == false) {
      nola.notiDownloadToolchain({
        id: device.libToolchain,
        path: 'tools'
      });
    }
    return true;
  }

  getDeviceByType(type) {
    for (d in this.deviceList) {
      if (type == this.deviceList[d].libType) {
        return this.deviceList[d];
      }
    }

    return null;
  }

  checkToolchain() {
    if (this.curDev != undefined) {
      if (nola.hasToolchain(this.curDev.libToolchain) == false) {
        nola.notiDownloadToolchain({
          id: this.curDev.libToolchain,
          path: 'tools'
        });
      }
    }
  }
}
