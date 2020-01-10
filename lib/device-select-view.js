'use babel';

import { CompositeDisposable } from 'atom';

const SelectListView = require('atom-select-list');
var nola = require('./nola-sdk.js');

export default class DeviceSelectView {
  panel: null;
  deviceList: [];
  curDev: null;
  controlPanel: null;
  selectListView: null;

  constructor(controlPanel) {
    this.controlPanel = controlPanel;

    this.refreshDevList();
    if (typeof controlPanel.currentProjectPath !== 'undefined') {
      this.loadDevice();
    }

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:checkToolchain': () => this.checkToolchain()
    }));

    this.selectListView = new SelectListView({
      items: this.deviceList,
      elementForItem: (item, {index, selected, visible}) => {
        if (!visible) {
          return document.createElement('li');
        }

        const li = document.createElement('li');
        li.classList.add('two-lines');

        const leftBlock = document.createElement('div');
        const titleEl = document.createElement('span');
        titleEl.classList.add('primary-line');
        titleEl.textContent = item.libName;
        leftBlock.appendChild(titleEl);

        li.appendChild(leftBlock);
        return li;
      },

      didConfirmSelection: (item) => {
        this.hide();
        if (!this.selectDev(item)) {
          return;
        }

        this.curDev = item;
        this.controlPanel.btnDevSelect.textContent = ' ' + item.libName;
      },
      didCancelSelection: () => {
        this.hide();
      },
      filterKeyForItem: (item) => {
        return `${item.libName} ${item.libType}`;
      }
    });
  }

  async destroy() {
    await this.selectListView.destroy();
  }

  toggle() {
    if (this.panel && this.panel.isVisible()) {
      this.hide();
      return Promise.resolve();
    } else {
      return this.show();
    }
  }

  async show() {
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this.selectListView });
    }

    this.selectListView.reset();

    this.refreshDevList();
    this.selectListView.update({ items: this.deviceList });

    const index = this.deviceList.findIndex((element) => element.libType === this.curDev.libType);
    this.selectListView.selectIndex(index);

    this.panel.show();
    this.selectListView.focus();
  }

  hide() {
    this.panel.hide();
  }


  refreshDevList() {
    this.deviceList = atom.config.get('nola-sdk.libVersions');
    if (typeof this.deviceList === 'undefined') {
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
    this.refreshDevList();

    if (this.controlPanel.currentProjectPath == undefined) {
      return;
    }

    f = this.controlPanel.currentProjectPath + path.sep + 'Nol.A-project.json';
    try {
      p = JSON.parse(fs.readFileSync(f).toString());
      if (p.board != undefined) {
        this.curDev = this.getDeviceByType(p.board);
        if (this.curDev != null) {
          this.controlPanel.btnDevSelect.textContent = ' ' + this.curDev.libName;
          this.checkToolchain();
        } else {
          this.controlPanel.btnDevSelect.textContent = ' Not supported device';
        }
      } else {
        this.controlPanel.btnDevSelect.textContent = ' Select your device.';
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
