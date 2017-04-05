'use babel';

import { CompositeDisposable } from 'atom';
import { SelectListView } from 'atom-space-pen-views';
XRegExp = require('xregexp');
fs = require('fs');
os = require('os');

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
      this.refreshPortList();
      this.setItems(this.portList);
      this.attach();
    } else {
      this.cancel();
    }
  }

  refreshPortList() {
    this.portList = ['None', 'JTAG'];
    if (os.platform() == 'win32' || os.platform() == 'win64') {
      for (i = 1; i <= 30; i++) {
        this.portList.push('COM' + i);
      }
    } else if (os.platform() == 'linux') {
      dirInfo = fs.readdirSync('/dev');
      dirXReg = XRegExp('tty.*' , 'gi');
      for (i = 0; i < dirInfo.length; i++) {
        if (XRegExp.exec(dirInfo[i], dirXReg) != null) {
          this.portList.push('/dev/' + dirInfo[i]);
        }
      }
    } else if (os.platform() == 'darwin') {
      dirInfo = fs.readdirSync('/dev');
      dirXReg = XRegExp('tty\\..*', 'gi');
      for (i = 0; i < dirInfo.length; i++) {
        if (XRegExp.exec(dirInfo[i], dirXReg) != null) {
          this.portList.push('/dev/' + dirInfo[i]);
        }
      }
    }
  }
}
