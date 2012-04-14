(function (exports) {

  var Section = exports.Section = function (node, itemName, options) {
    var key;

    this.node      =  node;
    this.itemName  =  itemName;
    node.source    =  this;

    for (key in options || {}) {
      this[key] = options[key];
    }
  };

  Object.defineProperties(Section.prototype, {
    active: {
      get: function () {
        return todo.activeSection === this;
      },

      set: function (value) {
        if (value && !this.active) {
          todo.activeSection.active = false;
          this.node.classList.add('active');
          todo.activeSection = this;
        } else if (!value && this.active) {
          this.node.classList.remove('active');
          todo.activeSection = null;
        }
      }
    },

    itemsNode: {
      get: function () {
        return this.node.querySelectorAll(this.itemName);
      }
    },

    items: {
      get: function () {
        return this.itemsNode.map(function (item) {
          return item.source;
        });
      }
    },

    activeItem: {
      get: function () {
        return this.active ? (this.node.querySelector('.active') || { source: null }).source : null;
      },

      set: function (item) {
        item.active = true;
      }
    },

    up:    { value: function () {}, writable: true },
    down:  { value: function () {}, writable: true },
    right: { value: function () {}, writable: true },
    left:  { value: function () {}, writable: true },
    close: { value: function () {}, writable: true },
  });

}(this));
