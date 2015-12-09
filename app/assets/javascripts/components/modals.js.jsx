var Modals = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
// Setup functions
  getInitialState: function() {
    return {
      modal: null,
      editId: null,
      newNotebookTitle: "",
      newNotebookDescription: "",
      encryptPass: '',
      encryptPassConfirm: '',
      encryptPassStrength: {},
      pending: false,
      hideEncryptWarning: false,
    };
  },
  componentWillMount: function() {
    ModalStore.addChangeListener(this.raiseModal);
  },
  componentWillUnmount: function() {
    ModalStore.removeChangeListener(this.raiseModal);
  },
  raiseModal: function () {
    var modalInfo = ModalStore.currentModal();
    switch (modalInfo.type) {
    case "deleteNote":
      this.setState({modal: this.deleteNoteModal(), editId: modalInfo.object.id});
      break;
    case "deleteNotebook":
      this.setState({modal: this.deleteNotebookModal(), editId: modalInfo.object.id});
      break;
    case "newNotebook":
      this.setState({modal: this.newNotebookModal(), editId: null});
      break;
    case "confirmDropChanges":
      this.setState({modal: this.confirmDropChangesModal(modalInfo.callback)});
      break;
    case "encryptWarning":
      this.setState({modal: this.encryptWarningModal(modalInfo.callback)});
      break;
    case "encryptNote":
      this.setState({modal: this.encryptNoteModal(modalInfo.callback)});
      break;
    case "decryptNote":
      this.setState({modal: this.decryptNoteModal(modalInfo.callback)});
      break;
    case "about":
      this.setState({modal: this.aboutModal()});
      break;
    default:
      this.setState({modal: null, editId: null});
    }
  },
// Modal functions
  spinner: function () {
    return (
      <div className="modal spinner">
        <i className="modal-spinner-image fa fa-spinner fa-spin " />
      </div>
    );
  },
  closeModal: function () {
    ModalActions.closeModal();
  },
  deleteNoteModal: function () {
    return (
      <div className="modal confirm-delete">
        <div>
          <p>Delete this note?</p>
          <button onClick={this.deleteNote}>Yes</button>
          <button onClick={this.closeModal}>No</button>
        </div>
      </div>
    );
  },
  deleteNote: function (e) {
    e.preventDefault();
    NotesAPIUtil.destroyNote({id: this.state.editId}, this.closeModal);
  },
  deleteNotebookModal: function () {
    return (
      <div className="modal confirm-delete">
        <div>
          <p>Delete this notebook?</p>
          <button onClick={this.deleteNotebook}>Yes</button>
          <button onClick={this.closeModal}>No</button>
        </div>
      </div>
    );
  },
  deleteNotebook: function (e) {
    e.preventDefault();
    NotebooksAPIUtil.destroyNotebook({id: this.state.editId}, this.closeModal);
  },
  newNotebookModal: function () {
    return(
      <div className="modal new-notebook-form">
        <div>
          <form onSubmit={this.newNotebook}>
            <label htmlFor="notebookTitle">Notebook title:</label>
            <input type="text" name="notebookTitle" onChange={this.titleChanged} />
            <label htmlFor="notebookDescription">Notebook description:</label>
            <input type="text" name="notebookDescription"  onChange={this.descriptionChanged}/>
            <button>Create notebook</button>
            <button onClick={this.closeModal}>Cancel</button>
          </form>
        </div>
      </div>
    );
  },
  newNotebook: function (e) {
    e.preventDefault();
    this.setState({pending: true, modal: this.spinner() });
    var notebook = {
      title: this.state.newNotebookTitle,
      description: this.state.newNotebookDescription
    };
    NotebooksAPIUtil.createNotebook(notebook, this.closeModal, function () {
      this.setState({modal: this.newNotebookModal(), editId: null });
    });
  },

  encryptWarningModal: function (callback) {
    var accept = function () {
      if (this.state.hideEncryptWarning) {
        UsersApiUtil.updateUser({hide_encrypt_warning: true});
      }
      this.setState({modal: this.encryptNoteModal(callback)});
    }.bind(this);


    return (
      <div className="modal confirm-encrypt">
        <div className="warning-text">
          <p>By clicking below you acknowledge your understanding that Pagevault does not retain
          encryption passwords.</p>

        <p><strong>If you lose or forget the password there will be no way to recover it.</strong></p>
          <input id="hide-warning" type="checkbox" onChange={this.hideEncryptWarningChange}></input>
          <label htmlFor="hide-warning">Don't show this warning again.</label>
          <button onClick={accept}>I understand</button>
        </div>
      </div>
    );
  },
  encryptNoteModal: function (callback) {
    var setPass = function (password) {
      callback(this.state.encryptPass);
    }.bind(this);
    return (
      <div className="modal confirm-encrypt">
        <div>
          <p>Encrypt this note.</p>
          <PasswordStrengthMeter onChange={this.encryptPassChanged}/>
          <button onClick={setPass}>Encrypt</button>
          <button onClick={this.closeModal}>Cancel</button>
        </div>
      </div>
    );
  },
  decryptNoteModal: function (callback) {
    return (
      <div className="modal confirm-decrypt">
        <div>
          <p>Remove encryption from this note?</p>
          <button onClick={callback}>Remove</button>
          <button onClick={this.closeModal}>Cancel</button>
        </div>
      </div>
    );
  },
  confirmDropChangesModal: function (callback) {
    return (
      <div className="modal confirm-delete">
        <div>
          <p>Discard changes to this encrypted note?</p>
          <button onClick={callback}>Yes</button>
          <button onClick={this.closeModal}>No</button>
        </div>
      </div>
    );
  },
// State update functions
  passwordErrors: function (password, confirm) {
    var errors = [];
    if (this.state.encryptPassStrength < 3) {
      errors.push("Too weak.");
    }
    if (password !== confirm) {
      errors.push("Confirmation doesn't match.");
    }
    return (
      <ul>
        {errors.map(function (error) {
          return (
            <li>{error}</li>
          );
        })}
      </ul>
    );
  },
  encryptPassConfirmChanged: function (e) {
    this.setState({encryptPassConfirmed: e.currentTarget.value});
  },
  hideEncryptWarningChange: function (e) {
    this.setState({hideEncryptWarning: e.currentTarget.checked});
  },
  encryptPassChanged: function (e) {
    this.setState({encryptPass: e.currentTarget.value});
  },
  titleChanged: function (e) {
    this.setState({newNotebookTitle: e.currentTarget.value});
  },
  descriptionChanged: function (e) {
    this.setState({newNotebookDescription: e.currentTarget.value});
  },



  render: function() {
    var modalClass;
    if (this.state.modal) {
      modalClass = "modal-bg";
    }
    return (
      <div className={modalClass}>
        {this.state.modal}
      </div>

    );
  }
});
