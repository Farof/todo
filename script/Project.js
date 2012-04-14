(function (exports) {

  var Project = exports.Project = function (options) {
    var i, task;
    options = options || {};

    this.initialize(options.uuid, 'project');

    this.name = options.name || 'new project';
    this.tasks = options.tasks || [];
    todo.projects.push(this);

    i = this.tasks.length;
    while (i-- > 0) {
      task = this.tasks[i];
      this.tasks[i] = new Task(this, task);
    }

    this.lastActiveTask = this.getTaskById(options.lastActiveTaskUUID);
  };

  Object.defineProperties(Project.prototype, Item);

  Object.defineProperties(Project.prototype, {
    serialize: {
      value: function () {
        return {
          uuid: this.uuid,
          name: this.node.querySelector('.text').textContent,
          tasks: this.tasks.map(function (t) { return t.serialize(); }),
          lastActiveTaskUUID: this.lastActiveTaskUUID
        };
      }
    },

    newTask: {
      value: function () {
        var t = new Task(this);
        this.tasks.push(t);
        return t;
      }
    },

    removeTask: {
      value: function (task) {
        var i = this.tasks.indexOf(task);
        if (i > -1) {
          this.tasks.splice(i, 1);
          task.project = null;
        }
        return this;
      }
    },

    getTaskById: {
      value: function (id) {
        var i = this.tasks.length;
        while (i-- > 0) {
          if (this.tasks[i].uuid === id) {
            return this.tasks[i];
          }
        }
        return null;
      }
    },

    initNode: {
      value: function () {
        this._node.setAttribute('id', this.uuid);
        this._node.querySelector('.input').setAttribute('value', this.name);
        this._node.querySelector('.text').textContent = this.name;
      }
    },

    load: {
      value: function () {
        var node = $('tasks-list'), i, ln, task;

        node.empty()
        ln = this.tasks.length;
        for (i = 0; i < ln; i += 1) {
          node.appendChild(this.tasks[i].node);
        }

        task = this.lastActiveTask || this.tasks[0];
        if (task) {
          task.active = true;
        }
      }
    },

    unload: {
      value: function () {
        if (this.active) {
          $('tasks-list').empty();
        }
      }
    },

    typeActive: {
      value: function (value) {
        if (value) {
          this.load();
          todo.sections.projects.active = true;
          todo.activeProject = this;
          localStorage.activeProject = this.uuid;
        } else {
          todo.activeProject = null;
        }
      }
    },

    contains: {
      value: function (task) {
        return this.tasks.indexOf(task) > -1;
      }
    },

    lastActiveTaskUUID: {
      get: function () {
        return this.lastActiveTask ? this.lastActiveTask.uuid : null;
      }
    },

    activeTask: {
      get: function () {
        var i;

        i = this.tasks.length;
        while (i-- > 0) {
          if (this.tasks[i].active) {
            return this.tasks[i];
          }
        }
        return null;
      },

      set: function (task) {
        if (this.active && this.tasks.indexOf(task) > -1) {
          task.active = true;
        }
      }
    },

    activeTaskIndex: {
      get: function () {
        var task = this.activeTask;
        return task ? this.tasks.indexOf(task) : -1;
      },

      set: function (index) {
        var task = this.tasks[index];
        if (task) {
          task.active = true;
        } else if (index < 0 && (task = this.tasks[0])) {
          task.active = true;
        } else if (index > this.tasks.length && (task = this.tasks.last)) {
          task.active = true;
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
            todo.sections.projectControl.active = true;
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
            todo.sections.projectControl.active = true;
          }
        }
      }
    },

    selectFirst: {
      value: function () {
        this.activeTaskIndex = 0;
      }
    },

    selectLast: {
      value: function () {
        this.activeTaskIndex = this.tasks.length - 1;
      }
    },

    next: {
      get: function () {
        var item = todo.projects[todo.projects.indexOf(this) + 1];
        return item ? item : null;
      }
    },

    previous: {
      get: function () {
        var item = todo.projects[todo.projects.indexOf(this) - 1];
        return item ? item : null;
      }
    },

    erase: {
      value: function () {
        var next = this.next || this.previous;

        this.unload();
        this.node.erase();
        todo.projects.remove(this);
        if (next) {
          next.active = true;
        } else {
          todo.lastActiveProject = null;
          todo.sections.projectControl.active = true;
          todo.save();
        }
      }
    }
  });

  Object.defineProperties(Project, {
    template: {
      get: function () {
        var template = this._template, tmp;
        if (!template) {
          this._template = template = document.createElement('div');
          template.classList.add('project');
          template.classList.add('item');

          tmp = document.createElement('input');
          tmp.setAttribute('type', 'text');
          tmp.classList.add('input');
          template.appendChild(tmp);

          tmp = document.createElement('p');
          tmp.classList.add('text');
          template.appendChild(tmp);
        }
        return template.cloneNode(true);
      }
    }
  });

}(this));
