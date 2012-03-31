(function (exports) {
  "use strict";

  var $ = function (id) {
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
    }
  });

  var Keys = {
    ENTER: 13,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    LEFT: 37,
    W: 87
  };

  window.addEventListener('DOMContentLoaded', function () {

    $('info-arrow').addEventListener('click', function () {
      var c = $('info').classList;
      c.toggle('hidden');
      localStorage.showInfo = !c.contains('hidden');
    }, false);

    $('projects-arrow').addEventListener('click', function () {
      var c = $('content').classList;
      c.toggle('collapse-projects');
      localStorage.hideProjects = c.contains('collapse-projects');
    }, false);

    document.addEventListener('click', function (e) {
      var
        target = e.target,
        item = todo.getActiveItem();

        if (target.classList.contains('task') || target.classList.contains('project')) {
          target.source.active = true;
        } else if (target.id === 'add-task') {
          todo.newTask();
        } else if (item) {
          item.editing = false;
          item.active = false;
        }
    });

    document.addEventListener('dblclick', function (e) {
      var
        target = e.target;

        if (target.classList.contains('task') || target.classList.contains('project')) {
          target.source.editing = true;
        }
    });    

    document.addEventListener('keydown', function (e) {
      var code = e.keyCode;

      //console.log('keydown: ', code, e);
      todo.event = e;

      if (code === Keys.ENTER) {          // edit or create new task / new project
        e.preventDefault();
        todo.activeSection.activeItem.activate();
      } else if (code === Keys.DOWN) {    // select next item
        todo.activeSection.down();
      } else if (code === Keys.UP) {      // select previous item
        todo.activeSection.up();
      } else if (code === Keys.LEFT) {    // select prevous section / projects
        todo.activeSection.left();
      } else if (code === Keys.RIGHT) {   // select next section / tasks
        todo.activeSection.right();
      } else if (code === Keys.W && e.altKey) {
        todo.activeSection.close();
      }

      delete todo.event;
    }, false);

    todo.init();

  }, false);

  var todo = exports.todo = {
    version: 0.1,

    sections: {},
    projects: [],
    tasks: [],

    save: function () {
      localStorage.projects = JSON.stringify(this.projects.map(function (p) { return p.serialize(); }));
    },

    reset: function () {
      delete localStorage.projects;
      delete localStorage.activeProject;
      delete localStorage.showInfo;
      delete localStorage.hideProjects;
      return localStorage;
    },

    init: function () {
      var i, ln;

      //console.dir(localStorage);

      if (localStorage.showInfo == "true") {
        $('info').classList.remove('hidden');
      }
      if (localStorage.hideProjects == "true") {
        $('content').classList.add('collapse-projects');
      }

      this.initSections();
      this.initControls();

      this.projects = JSON.parse(localStorage.projects || '[]').map(function (project) {
        return new Project(project);
      });

      if (this.projects.length === 0) {
        // create default project
        this.newProject(true);
      } else {
        // display all projects
        ln = this.projects.length;
        for (i = 0; i < ln; i += 1) {
          $('projects-list').appendChild(this.projects[i].node);
        }
      }

      if (typeof localStorage.activeProject === 'string') {
        // load active project from localStorage
        this.activeProject = this.getProjectById(localStorage.activeProject);
      }

      // load active project or default one
      (this.activeProject || this.projects[0])['active'] = true;

      this.save();

      if (this.projects.length === 1 && this.activeProject.tasks.length === 0) {
        // create default task
        this.newTask();
      } else {
        this.activeProject.load();
      }
    },

    initSections: function () {
      this.sections.projects  =  new Section($('projects-list'),  'project', {
        up: function () {
          this.activeItem.selectPrevious();
        },
        down: function () {
          this.activeItem.selectNext();
        },
        right: function () {
          if (!this.activeItem.editing) {
            if (this.activeItem.tasks.length > 0) {
              (todo.lastActiveSection || todo.sections.tasks)['active'] = true;
            } else {
              todo.sections.controls.active = true;
            }
          }
        }
      });
      this.sections.tasks     =  new Section($('tasks-list'),     'task', {
        up: function () {
          if (this.activeItem || (this.activeItem = todo.activeProject.lastActiveTask)) {
            this.activeItem.selectPrevious();
          } else {
            todo.sections.controls.active = true;
          }
        },
        down: function () {
          if (this.activeItem || (this.activeItem = todo.activeProject.lastActiveTask)) {
            this.activeItem.selectNext();
          } else {
            todo.sections.controls.active = true;
          }
        },
        left: function () {
          if (!this.activeItem || !this.activeItem.editing) {
            todo.sections.projects.active = true;
          }
        },
        close: function () {
          if (!this.activeItem.editing) {
            this.activeItem.erase();
          }
        }
      });
      this.sections.controls  =  new Section($('tasks-control'),  'control', {
        up: function () {
          if (todo.activeProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
            todo.activeProject.selectLast();
          }
        },
        down: function () {
          if (todo.activeProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
            todo.activeProject.selectFirst();
          }
        },
        left: function () {
          todo.sections.projects.active = true;
        }
      });

      this.activeSection = {};
      this.sections.tasks.active = true;
    },

    initControls: function () {
      $('add-task').source = {
        activate: function () {
          todo.sections.controls.up();
          todo.newTask();
        }
      };
    },

    bootstrap: function () {
      var i;

      i = 20;
      while (i-- > 0) {
        this.newTask(true);
      }
    },

    newProject: function (noEdit) {
      var p = new Project();
      $('projects-list').appendChild(p.node);
      p.editing = noEdit ? false : true;
    },

    newTask: function (noEdit) {
      var t = todo.getActiveProject().newTask();
      $('tasks-list').appendChild(t.node);
      t.editing = noEdit ? false : true;
    },

    getActiveProject: function () {
      var p = document.querySelector('.project.active');
      return p ? p.source : null;
    },

    getActiveItem: function () {
      return todo.activeSection.activeItem;
    },

    getActiveTask: function () {
      var t = document.querySelector('.task.active');
      return t ? t.source : null;
    },

    getProjectById: function (id) {
      var i = this.projects.length;
      while (i-- > 0) {
        if (this.projects[i].uuid === id) {
          return this.projects[i];
        }
      }
      return null;
    },

    getTaskById: function (id) {
      var i = this.tasks.length;
      while (i-- > 0) {
        if (this.tasks[i].uuid === id) {
          return this.tasks[i];
        }
      }
      return null;
    }
  };

  var Section = function (node, itemName, options) {
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
          todo.lastActiveSection = this;
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

  var Item = {
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

  var Project = function (options) {
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

    typeActive: {
      value: function (value) {
        if (value) {
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

  var Task = function (project, options) {
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
            todo.sections.controls.active = true;
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
            todo.sections.controls.active = true;
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
          todo.sections.controls.active = true;
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

}(this));
