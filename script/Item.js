(function (exports) {

  var Item = exports.Item = {
    initialize: {
      value: function (_uuid, type) {
        this.uuid = _uuid || uuid();
        this.type = type;
      }
    },

    activate: {
      value: function () {
        this.editing = !this.editing;
      }
    },

    editing: {
      get: function () {
        return this.node.classList.contains('editing');
      },

      set: function (value) {
        var
          node = this.node,
          prev,
          input = node.querySelector('.input'),
          text = node.querySelector('.text');

        if (value && !this.editing) {
          this.active = true;
          prev = document.querySelector('.' + this.type + '.editing');
          if (prev) {
            prev.source.editing = false;
          }
          node.classList.add('editing');
          setTimeout(function () {
            input.focus();
          }, 50);
          input.selectionStart = 0;
          input.selectionEnd = input.value.length;
        } else if (!value && this.editing) {
          node.querySelector('.text').textContent = this.node.querySelector('.input').value;
          node.classList.remove('editing');
          todo.save();
        }
      }
    },

    active: {
      get: function () {
        return document.querySelector('.' + this.type + '.active') === this.node;
      },

      set: function (value) {
        var prev, event = todo.event;
        if (value && !this.active) {
          prev = document.querySelector('.' + this.type + '.active');
          if (prev) {
            prev.source.active = false;
          }
          if (todo.event) {
            todo.event.preventDefault();
          }
          this.node.classList.add('active');
          setTimeout(function () {
            this.node.scrollTo();
          }.bind(this), 50);
        } else if (!value && this.active) {
          this.editing = false;
          this.node.classList.remove('active');
        }
        this.typeActive(value);
      }
    },

    node: {
      get: function () {
        var node = this._node;
        if (!node) {
          node = this._node = this.constructor.template;
          node.source = this;
          this.initNode();
        }
        return node;
      }
    }
  };
  
}(this));
