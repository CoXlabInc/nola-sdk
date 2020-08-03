'use babel';

export default {
  orgKey: {
    title: 'Organization Key',
    description: 'Enter provided 8-byte hexadecimal key to use organization-specific devices. (e.g., 1A2B3C4D5E6F7A8B)',
    type: 'string',
    default: '',
    order: 1
  },

  hwLibDevMode: {
    title: 'Hardware Library Development Mode',
    description: 'Build hardware library source and link Nol.A project with it instead of downloaded binaries.',
    type: 'boolean',
    default: 'false',
    order: 2
  },

  hwLibSourcePath: {
    title: 'Hardware Library Source Path',
    description: 'Enter the absolute path of the hardware library source for the hardware library development mode. Note that this path MUST be absolute. For Windows, the library source must be cloned in the default WSL and its path must be an absolute path in WSL.',
    type: 'string',
    default: '',
    order:3
  },

  deviceDriverDevMode: {
    title: 'Device Driver Development Mode',
    description: 'Build the Device Driver source and link Nol.A project with it instead of downloaded binaries.',
    type: 'boolean',
    default: 'false',
    order: 2
  },

  deviceDriverSourcePath: {
    title: 'Device Driver Source Path',
    description: 'Enter the absolute path of the Device Driver source for the Device Driver development mode. Note that this path MUST be absolute.',
    type: 'string',
    default: '',
    order:3
  },
};
