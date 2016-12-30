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
    }));

    console.log('act');
  },

  deactivate() {
    this.subscriptions.dispose();
    this.createProjectView.destroy();
  },

  serialize() {
    return {
      nolaSdkViewState: this.createProjectView.serialize()
    };
  },

  toggle() {
    console.log('Toggle!!!!!!');
  },

  showControlPanel() {
    console.log('showControlPanel');
    this.controlPanelView.doShow();
  },

  createProject() {
    console.log('CreateProject');
    this.createProjectView.doShow();
  },
};
