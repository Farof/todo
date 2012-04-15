(function (exports) {
  "use strict";

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
        } else if (target.id === 'add-project') {
          todo.newProject();
        } else if (item) {
          item.editing = false;
          item.active = false;
          todo.activeSection.active = false;
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

      if (code === Keys.ENTER && todo.activeSection) {          // edit or create new task / new project
        e.preventDefault();
        todo.activeSection.activeItem.activate();
      } else if (code === Keys.DOWN) {    // select next item
        todo.lastActiveSection.down();
      } else if (code === Keys.UP) {      // select previous item
        todo.lastActiveSection.up();
      } else if (code === Keys.LEFT) {    // select prevous section / projects
        todo.lastActiveSection.left();
      } else if (code === Keys.RIGHT) {   // select next section / tasks
        todo.lastActiveSection.right();
      } else if (code === Keys.W && e.altKey && todo.activeSection) {
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
          if (this.activeItem || (this.activeItem = todo.lastActiveProject)) {
            this.activeItem.selectPrevious();
          } else {
            todo.sections.projectControl.active = true;
          }
        },
        down: function () {
          if (this.activeItem || (this.activeItem = todo.lastActiveProject)) {
            this.activeItem.selectNext();
          } else {
            todo.sections.projectControl.active = true;
          }
        },
        right: function () {
          if (!this.activeItem || !this.activeItem.editing) {
            if (this.activeItem && this.activeItem.tasks.length > 0) {
              todo.sections.tasks.active = true;
            } else {
              todo.sections.taskControl.active = true;
            }
          }
        },
        left: function () {
          if (!this.activeItem || !this.activeItem.editing) {
            todo.sections.projectControl.active = true;
          }
        },
        close: function () {
          if (this.activeItem && !this.activeItem.editing) {
            this.activeItem.erase();
          }
        }
      });

      this.sections.projectControl = new Section($('projects-control'), 'control', {
        up: function () {
          if (todo.projects.length > 0) {
            todo.sections.projects.active = true;
            todo.projects.last.active = true;
          } else {
            this.active = true;
          }
        },
        down: function () {
          if (todo.projects.length > 0) {
            todo.sections.tasks.active = true;
            todo.projects[0].active = true;
          } else {
            this.active = true;
          }
        },
        left: function () {
          if (todo.projects.length > 0) {
            todo.sections.projects.active = true;
            todo.lastActiveProject.active = true;
          } else {
            this.active = true;
          }
        },
        right: function () {
          if (todo.lastActiveProject && todo.lastActiveProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
          } else {
            todo.sections.taskControl.active = true;
          }
        }
      });

      this.sections.tasks     =  new Section($('tasks-list'),     'task', {
        up: function () {
          if (this.activeItem || (this.activeItem = todo.activeProject.lastActiveTask)) {
            this.activeItem.selectPrevious();
          } else {
            todo.sections.taskControl.active = true;
          }
        },
        down: function () {
          if (this.activeItem || (this.activeItem = todo.activeProject.lastActiveTask)) {
            this.activeItem.selectNext();
          } else {
            todo.sections.taskControl.active = true;
          }
        },
        left: function () {
          if (!this.activeItem || !this.activeItem.editing) {
            if (todo.projects.length > 0) {
              todo.sections.projects.active = true;
            } else {
              todo.sections.projectControl.active = true;
            }
          }
        },
        right: function () {
          if (!this.activeItem || !this.activeItem.editing) {
            todo.sections.taskControl.active = true;
          }
        },
        close: function () {
          if (!this.activeItem.editing) {
            this.activeItem.erase();
          }
        }
      });

      this.sections.taskControl  =  new Section($('tasks-control'),  'control', {
        up: function () {
          if (todo.lastActiveProject && todo.lastActiveProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
            todo.activeProject.selectLast();
          } else {
            this.active = true;
          }
        },
        down: function () {
          if (todo.lastActiveProject && todo.lastActiveProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
            todo.activeProject.selectFirst();
          } else{
            this.active = true;
          } 
        },
        left: function () {
          if (todo.projects.length > 0) {
            todo.sections.projects.active = true;
          } else {
            todo.sections.projectControl.active = true;
          }
        },
        right: function () {
          if (todo.lastActiveProject && todo.lastActiveProject.tasks.length > 0) {
            todo.sections.tasks.active = true;
            todo.activeProject.lastActiveTask.active = true;
          } else {
            this.active = true;
          }
        }
      });

      this.activeSection = {};
      this.sections.tasks.active = true;
    },

    initControls: function () {
      $('add-task').source = {
        activate: function () {
          todo.sections.taskControl.up();
          todo.newTask();
        }
      };

      $('add-project').source = {
        activate: function () {
          todo.sections.projectControl.up();
          todo.newProject();
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
      p.active = true;
      p.editing = noEdit ? false : true;
      return p;
    },

    newTask: function (noEdit) {
      var
        p = todo.getActiveProject(),
        t = (p || this.newProject(true)).newTask();
      $('tasks-list').appendChild(t.node);
      t.active = true;
      t.editing = noEdit ? false : true;
      return t;
    },

    getActiveProject: function () {
      var p = document.querySelector('.project.active');
      return p ? p.source : null;
    },

    getActiveItem: function () {
      return todo.lastActiveSection.activeItem;
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

}(this));
