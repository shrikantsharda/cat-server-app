(function() {
  'use strict';

  // Cat module config
  angular
    .module('cat')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Config logic
    // ...
    Menus.addMenuItem('topbar', {
      title: 'Catalogue',
      state: 'cat',
      type: 'item',
      roles: ['*']
    });
  }
})();
