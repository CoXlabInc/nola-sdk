'use babel';

import { CompositeDisposable } from 'atom';

const SelectListView = require('atom-select-list');
const fs = require('fs');
const os = require('os');
const serialport = require('serialport');

const defaultPort = ' None';

export default class PortSelectView {
  controlPanel: null;
  btnPortSelect: null;
  portList: [];
  curPort: null;
  selectListView: null;

  constructor(controlPanel) {
    this.controlPanel = controlPanel;

    this.refreshPortList();
    this.controlPanel.btnPortSelect.textContent = defaultPort;
    this.curPort = defaultPort;

    this.selectListView = new SelectListView({
      items: this.portList,
      elementForItem: (item, {index, selected, visible}) => {
        if (!visible) {
          return document.createElement('li');
        }

        const li = document.createElement('li');
        li.classList.add('two-lines');

        const leftBlock = document.createElement('div');
        const titleEl = document.createElement('span');
        titleEl.classList.add('primary-line');

        if (typeof item.comName === 'undefined') {
          titleEl.textContent = item;
        } else {
          titleEl.textContent = item.comName;
        }

        leftBlock.appendChild(titleEl);

        if (typeof item.manufacturer !== 'undefined') {
          let secondaryEl = document.createElement('span');
          secondaryEl.classList.add('secondary-line');
          secondaryEl.textContent = item.manufacturer;

          leftBlock.appendChild(secondaryEl);
        }

        li.appendChild(leftBlock);
        return li;
      },

      didConfirmSelection: (item) => {
        this.hide();
        this.curPort = item;
        if (typeof item.comName === 'undefined') {
          this.controlPanel.btnPortSelect.textContent = ' ' + item;
        } else {
          this.controlPanel.btnPortSelect.textContent = ' ' + item.comName;
        }

      },
      didCancelSelection: () => {
        this.hide();
      },
      filterKeyForItem: (item) => {
        if (typeof item.comName !== 'undefined' && typeof item.manufacturer !== 'undefined') {
          return `${item.comName} ${item.manufacturer}`;
        } else if (typeof item === 'string') {
          return item.trim();
        }
      }
    })
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

    await this.refreshPortList();
    this.selectListView.update({ items: this.portList });

    const index = this.portList.findIndex(element => {
      if (typeof this.curPort === 'string') {
        return (typeof element === 'string' && this.curPort.trim() === element);
      } else {
        return (typeof element === 'object' && this.curPort.comName === element.comName);
      }
    })
    if (index >= 0) {
      this.selectListView.selectIndex(index);
    }

    this.panel.show();
    this.selectListView.focus();
  }

  hide() {
    this.panel.hide();
  }

  async refreshPortList() {
    this.portList = ['None', 'JTAG'];
    try {
      const ports = await serialport.list();
      this.portList = this.portList.concat(ports);
    } catch(e) {
      console.error(e);
    }
  }
}
