'use babel';

import { CompositeDisposable } from 'atom';

export default class DeviceSelectView {
  panel: null;
  sep: null;
  deviceList: [];
  curDev: null;
  btnCancel: null;
  btnDevSelect: null;

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');

    // Create message element
    const title = document.createElement('h1');
    title.textContent = 'Select your device type.';

    const btnCancel = document.createElement('span');
    btnCancel.classList.add('pull-right');
    btnCancel.classList.add('icon-x');
    title.appendChild(btnCancel);
    this.element.appendChild(title);
    this.btnCancel = btnCancel;

    const btn1 = document.createElement('button');
    btn1.textContent = '1';
    btn1.classList.add('btn');
    btn1.classList.add('btn-block');
    this.element.appendChild(btn1);

    btnCancel.addEventListener('click', this);
    this.btnCancel = btnCancel;

    this.panel = atom.workspace.addModalPanel({
      item: this.element,
      visible: false
    });
  }

  handleEvent(event) {
    if (event.target == this.btnCancel && event.type == 'click') {
      this.panel.hide();
    }
  }

  doShow() {
    if (this.panel.isVisible() == false) {
      this.panel.show();
    }
  }
}
