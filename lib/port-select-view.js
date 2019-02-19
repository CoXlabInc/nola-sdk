'use babel';

import { CompositeDisposable } from 'atom';
import { SelectListView } from 'atom-space-pen-views';
fs = require('fs');
os = require('os');
serialport = require('serialport');

const defaultPort = ' None';

export default class PortSelectView extends SelectListView {
  controlPanel: null;
  btnPortSelect: null;
  portList: [];
  curPort: null;

  constructor(serializedState, controlPanel) {
    super(serializedState);
    this.controlPanel = controlPanel;
    this.addClass('grammar-selector');
    this.list.addClass('mark-active')

    this.refreshPortList();
    this.controlPanel.btnPortSelect.textContent = defaultPort;
    this.curPort = defaultPort;
  }

  destroy() {
    this.cancel();
  }

  viewForItem(port) {
    var element = document.createElement('li');
    if (port == this.curPort) {
      element.classList.add('active');
    }
    element.textContent = port;
    return element;
  }

  cancelled() {
    if (this.panel != undefined) {
      this.panel.destroy();
    }
    this.panel = null;
    this.editor = null;
  }

  confirmed(port) {
    this.curPort = port;
    this.controlPanel.btnPortSelect.textContent = ' ' + port;
    this.cancel();
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
      this.refreshPortList();
      this.attach();
    } else {
      this.cancel();
    }
  }

  refreshPortList() {
    this.portList = ['None', 'JTAG'];
    serialport.list().then(
      ports => ports.forEach((p) => {
        this.portList.push(p.comName);
        this.setItems(this.portList);
      }),
      err => console.error(err)
    );
  }
}
