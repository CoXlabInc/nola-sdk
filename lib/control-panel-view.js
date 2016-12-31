'use babel';

import DeviceSelectView from './device-select-view';

export default class ControlPanelView {
  devSelectView: null;
  portSeletView: null;
  panel: null;
  btnDevSelect: null;

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');
    this.element.classList.add('nola-sdk-tool-bar');

    var btnPortSelect = document.createElement('button');
    btnPortSelect.classList.add('pull-right');
    btnPortSelect.classList.add('btn');
    btnPortSelect.classList.add('icon');
    btnPortSelect.classList.add('icon-plug');
    btnPortSelect.textContent = 'None';

    this.element.appendChild(btnPortSelect);

    var btnDevSelect = document.createElement('button');
    btnDevSelect.classList.add('pull-right');
    btnDevSelect.classList.add('btn');
    btnDevSelect.classList.add('icon');
    btnDevSelect.classList.add('icon-check');
    btnDevSelect.textContent = 'Select your device.';

    this.element.appendChild(btnDevSelect);

    this.panel = atom.workspace.addTopPanel({
      item: this.element,
      visible: false,
    });

    this.devSelectView = new DeviceSelectView(serializedState, btnDevSelect);
    btnDevSelect.addEventListener('click', this);
    this.btnDevSelect = btnDevSelect;

  }

  handleEvent(event) {
    if (event.target == this.btnDevSelect && event.type == 'click') {
      this.devSelectView.doShow();
    }
  }

  doShow() {
    if (this.panel.isVisible() == false) {
      this.panel.show();
    }
  }

  showDevSelectView() {
    console.log('showDevSelectView');
  }
}
