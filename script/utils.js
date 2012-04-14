(function (exports) {

  var $ = exports.$ = function (id) {
    return document.getElementById(id);
  };

  Object.defineProperties(HTMLElement.prototype, {
    scrollTo: {
      value: function () {
        var
          rect = this.getBoundingClientRect(),
          parent = this.parentNode,
          parentRect = parent.getBoundingClientRect(),
          top = parentRect.top + parent.scrollTop;

        if (rect.bottom > (parentRect.top + parentRect.height + parent.scrollTop)) {
          parent.scrollTop = rect.bottom - parentRect.height + parent.scrollTop + rect.height / 2;
        } else if (rect.top < parentRect.top) {
          parent.scrollTop = parent.scrollTop - parentRect.top + rect.top - rect.height / 2;
        }
      }
    },

    empty: {
      value: function () {
        while (this.children[0]) {
          this.removeChild(this.children[0]);
        }
        return this;
      }
    },

    erase: {
      value: function () {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
        return this;
      }
    }
  });

  Object.defineProperties(Array.prototype, {
    last: {
      get: function () {
        return this[this.length - 1];
      }
    },

    remove: {
      value: function (item) {
        var index = this.indexOf(item);
        if (index > -1) {
          this.splice(index, 1);
        }
        return this;
      }
    } 
  });

}(this));
