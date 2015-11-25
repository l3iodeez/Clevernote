
var NoteForm = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function() {

    var selectedNote = SelectedStore.getNote();
    var id = selectedNote ? selectedNote.id : "";
    var title = selectedNote ? selectedNote.title : "";
    var body = selectedNote ? selectedNote.body : "";
    var is_archived  = selectedNote ? selectedNote.is_archived : "";
    var tags = selectedNote ? selectedNote.tags : "";
    return {
      id: id,
      title: title,
      body: body,
      is_archived: is_archived,
      notebook_id: "",
      saving: "saved",
      tags: tags,
      tagsDirty: false
    };
  },
  importID: function () {
    this.setState({ id: SelectedStore.getNote().id });
  },
  changeSelectedNote: function () {
    this.setState($.extend({saving: "saved"}, SelectedStore.getNote() ));
  },
  resetForm: function () {
    this.setState({
      id: "",
      title: "",
      body: "",
      is_archived: "",
      notebook_id: "",
      tags: "",
      saving: "saved"
    });
  },
  importNote: function () {
    var note = SelectedStore.getNote();
    if (note) {
      this.setState({
        id: note.id,
        title: note.title,
        body: note.body,
        notebook_id: note.notebook_id,
        is_archived: note.is_archived,
        tags: note.tags
      });
    }
  },
  componentWillReceiveProps: function () {
    this.handleSubmit();

  },
  newNoteReceived: function () {
    clearTimeout(this.timeoutID);

    if (!this.state.id && this.state.creating) {
      this.importID();
    } else if (!this.state.id || this.state.id === "") {
      this.importNote();
    } else if (SelectedStore.getNote() && (this.state.id !== SelectedStore.getNote().id)) {
      this.changeSelectedNote();
    } else if (!SelectedStore.getNote()) {
      this.resetForm();
    }
  },
  newNotebookSelected: function () {
    this.handleSubmit();
    SelectedStore.setNote(SelectedStore.getNotebook().firstNote);
  },
  componentDidMount: function () {
    SelectedStore.addNoteChangeListener(this.newNoteReceived);
    SelectedStore.addNotebookChangeListener(this.newNotebookSelected);

  },
  componentWillUnmount: function () {
    SelectedStore.removeNoteChangeListener(this.newNoteReceived);
    SelectedStore.removeNotebookChangeListener(this.newNotebookSelected);
    tinymce.remove();

    this.handleSubmit();
  },
  handleSubmit: function (e, attrs, callback) {
    clearTimeout(this.timeoutID);
    this.timeoutID = null;

    if (e) {
      e.preventDefault();
    }
    if (this.state.creating) {
      return;
    }
    if (this.state.saving === "saving" || this.state.saving === "dirty") {

      var apiCallback = function (data) {
        var note = NoteStore.getByID(data.id);
        this.setState({creating: false});
        if (typeof callback === "function") {
          callback();
        }
      }.bind(this);

      var note = {
          title: attrs.title || this.state.title,
          body: attrs.body || this.state.body,
          notebook_id: SelectedStore.getNotebook().id,
          tags: this.state.tags
      };
      if (this.state.id) {
        note.id = this.state.id;
        note.is_archived = this.state.is_archived;
        NotesAPIUtil.editNote(note, apiCallback);
      } else {
        if (this.state.title.length === 0 && this.state.body.length === 0 ) {
          this.setState({saving: "saved"});
          return;
        }
        note = {
          title: this.state.title,
          body: this.state.body,
          notebook_id: SelectedStore.getNotebook().id
        };
        this.setState({creating: true});
        NotesAPIUtil.createNote(note, apiCallback);
      }
    }
    if (e) {
      this.props.toggleNoteIndex();
    }

  },


  saveTimeout: function (attrs) {
    if (this.state.saving !== "saving") {
      clearTimeout(this.timeoutID);
      this.timeoutID = setTimeout(function () {
        this.setState({saving: "saving"});
        this.handleSubmit(null, attrs, function () {
          this.setState({saving: "saved"});
        }.bind(this));
      }.bind(this), 2000);
    }
  },
  updateBody: function(content) {
    console.log("body updated");
    this.setState({body: content, saving: "dirty"});
    this.saveTimeout({body: content});
  },
  updateTitle: function(e) {
    this.setState({title: e.currentTarget.value, saving: "dirty"});
    this.saveTimeout({title: e.currentTarget.value });
  },
  newNote: function (e) {
    e.preventDefault();
    this.setState({
      id: "",
      title: "",
      body: "",
      is_archived: ""
    });
    this.props.setSelected(null);
  },
  cancel: function (e) {
    e.preventDefault();
    this.props.toggleNoteIndex();
  },
  showDeleteConfirm: function () {
    if (this.state.id) {
      ModalActions.raiseModal({type: "deleteNote", object: {id: this.state.id}});
    }
  },
  changeTags: function (e) {
    this.setState({tags:e.currentTarget.value });
  },
  updateTags: function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({tagsDirty: true});
    if (this.state.id) {
      var tags = this.state.tags.split(',').map(function (tag) {
          return tag.trim().toLowerCase().split(' ');
      }).reduce(function(a, b) {
        return a.concat(b);
      });
      var note = {
        id: this.state.id,
        tags: tags
      };
      NotesAPIUtil.editNote(note, function () {
        this.setState({tagsDirty: false});
      }.bind(this));
    }
  },
  render: function() {
    var formClass = "note-form ";
    var cancelButtonClass = "cancel-button";
    var saveButtonClass = "save-button";
    var tinyMceBox = "tiny-mce-box ";


    if (this.props.fullWidth) {
      formClass += "new";
      tinyMceBox += "new";
    } else {
      formClass += "edit";

      saveButtonClass += " hidden";
      cancelButtonClass += " hidden";
    }
    if (this.state.title.length === 0 && this.state.body.length === 0) {
      saveButtonClass += " hidden";
    } else {
      cancelButtonClass += " hidden";
    }
    return (
      <div className={formClass} >
        <div className={formClass + " header"}>
          <div className="header-delete icon" onClick={this.showDeleteConfirm}>
          </div>
            <form onSubmit={this.updateTags} className="tag-input-form note-tags">
              <span htmlFor="tags">Tags</span>
              <input
                name="tags"
                onClick={this.enterTags}
                type="text"
                className="tag-input note-tags"
                value={this.state.tags}
                onBlur={this.updateTags}
                onChange={this.changeTags} />
                {this.state.tagsDirty ? <div className="tiny-spinner note-tags" /> : null}
            </form>
        </div>
        <form onSubmit={this.handleSubmit}>
          <div className="button-container">
            <button className={saveButtonClass}>Done</button>
            <button className={cancelButtonClass} onClick={this.cancel}>Cancel</button>
          </div>
          <label htmlFor="noteTitle">Note Title</label>
            <br />
            <input
              id="noteTitle"
              type="text"
              placeholder={"Title your note"}
              name="title"
              value={this.state.title}
              onChange={this.updateTitle}
            />
            <div className={"save-indicator " + this.state.saving} />
          <br />
          <label htmlFor="noteBody">Note Body</label>
            <br />
            <div className={tinyMceBox}>
              <TinyMCEInput
                value={this.state.body}
                onChange={this.updateBody}
                config={{
                  plugins: 'image lists print preview',
                  toolbar: 'undo redo | bold italic | alignleft aligncenter alignright',
                }} />
            </div>
          <br />

        </form>
      </div>
    );
  }
});
            // <textarea
            //   id="noteBody"
            //   className="tinymce"
            //   name="body"
            //   placeholder={"Drag files here or just start typing..."}
            //   value={this.state.body}
            //   onChange={this.updateBody}
            // />
