'use babel';

import { CompositeDisposable } from 'atom';
import { SelectListView } from 'atom-space-pen-views';
import ToolchainDownloadView from './toolchain-download-view';

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
      this.refreshDevList();
      this.setItems(this.deviceList);
      this.attach();
    } else {
      this.cancel();
    }
  }

  refreshDevList() {
    this.deviceList = atom.config.get('nola-sdk.libVersions');
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
    f = this.controlPanel.currentProjectPath + path.sep + '.atom-build.json';
    try {
      p = JSON.parse(fs.readFileSync(f).toString());
      if (p.args != undefined && p.args.length > 0) {
        this.curDev = this.getDeviceByType(p.args[0]);
        this.populateList();
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
      alert('Error: invalid project.');
    }
  }

  clearDevice() {
    this.curDev = null;
    this.populateList();
    this.controlPanel.btnDevSelect.textContent = ' Select your device.';
  }

  selectDev(device) {
    f = this.controlPanel.currentProjectPath + path.sep + '.atom-build.json';

    try {
      p = JSON.parse(fs.readFileSync(f).toString());
      p.args = [
        device.libType
      ];
      fs.writeFileSync(f, JSON.stringify(p, null, ' '));
    } catch (e) {
      alert ('Error : accessing project information failure.');
      return false;
    }

    if (this.hasToolchain(device.libToolchain) == false) {
      this.notiDownloadToolchain(device.libName, device.libToolchain, this.doDownloadToolchain);
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

  hasToolchain(toolchain) {
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

  checkToolchain() {
    if (this.curDev != undefined) {
      if (this.hasToolchain(this.curDev.libToolchain) == false) {
        this.notiDownloadToolchain(this.curDev.libName, this.curDev.libToolchain, this.doDownloadToolchain);
      }
    }
  }

  notiDownloadToolchain(libName, libToolchain, doDownload) {
    noti = atom.notifications.addInfo("[" + libName + "] Additional tool is required!", {
      dismissable: true,
      detail: libToolchain,
      buttons: [{
        text: 'Download',
        className: 'btn-downloadDo',
        onDidClick() {
          noti.dismiss();
          doDownload(libToolchain);
        }
      }]
    });
  }

  doDownloadToolchain(libToolchain) {
    toolchainDownloadView = new ToolchainDownloadView(libToolchain);
    downloadPanel = atom.workspace.addModalPanel({
      item: toolchainDownloadView.element,
      visible: true
    });
    toolchainDownloadView.setPanel(downloadPanel);
    toolchainDownloadView.doDownload();
  }
}
