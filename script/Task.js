(function (exports) {

  var Task = exports.Task = function (project, options) {
    options = options || {};
    this.initialize(options.uuid, 'task');
    this.description = (typeof options.description === 'string') ? options.description : 'new task';
    this.project = project;
    todo.tasks.push(this);
  };

  Object.defineProperties(Task.prototype, Item);

  Object.defineProperties(Task.prototype, {
    serialize: {
      value: function () {
        return {
          uuid: this.uuid,
          description: this.node.querySelector('.text').textContent
        };
      }
    },

    initNode: {
      value: function () {
        this._node.setAttribute('id', this.uuid);
        this._node.querySelector('.input').textContent = this.description;
        this._node.querySelector('.text').textContent = this.description;
      }
    },

    typeActive: {
      value: function (value) {
        if (value) {
          todo.sections.tasks.active = true;
          todo.activeTask = this;
          this.project.lastActiveTask = this;
          todo.save();
        } else {
          todo.activeTask = null;
        }
      }
    },

    selectNext: {
      value: function () {
        var next;
        if (!this.editing) {
          next = this.next;
          if (next) {
            next.active = true;
          } else {
            todo.sections.taskControl.active = true;
          }
        }
      }
    },

    selectPrevious: {
      value: function () {
        var prev;
        if (!this.editing) {
          prev = this.previous;
          if (prev) {
            prev.active = true;
          } else {
            todo.sections.taskControl.active = true;
          }
        }
      }
    },

    next: {
      get: function () {
        var item = this.project.tasks[this.project.tasks.indexOf(this) + 1];
        return item ? item : null;
      }
    },

    previous: {
      get: function () {
        var item = this.project.tasks[this.project.tasks.indexOf(this) - 1];
        return item ? item : null;
      }
    },

    erase: {
      value: function () {
        var next = this.next || this.previous;

        this.node.erase();
        this.project.removeTask(this);
        if (next) {
          next.active = true;
        } else {
          this.lastActiveTask = null;
          todo.sections.taskControl.active = true;
          todo.save();
        }
      }
    }
  });

  Object.defineProperties(Task, {
    template: {
      get: function () {
        var template = this._template, tmp;
        if (!template) {
          this._template = template = document.createElement('div');
          template.classList.add('task');
          template.classList.add('item');

          tmp = document.createElement('textarea');
          tmp.classList.add('input');
          tmp.setAttribute('type', 'text');
          template.appendChild(tmp);

          tmp = document.createElement('p');
          tmp.classList.add('text');
          template.appendChild(tmp);
        }
        return template.cloneNode(true);
      }
    }
  });

}(this))
