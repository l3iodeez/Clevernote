var NotebooksIndex = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  getInitialState: function() {
    return {notebooks: NotebookStore.all(), displayNewNoteForm: false, newNotebookTitle: "", newNotebookDescription: ""};
  },
  notebooksChanged: function () {
    this.setState({notebooks: NotebookStore.all()});
  },
  newNotebook: function () {
    ModalActions.raiseModal({type: "newNotebook", object: {}});
  },

  componentDidMount: function() {
    NotebookStore.addChangeListener(this.notebooksChanged);
  },
  componentWillUnmount: function() {
    NotebookStore.removeChangeListener(this.notebooksChanged);
  },

  render: function() {
    var indexClass = "notebook-index";
    if (!this.props.show) {
      indexClass +=" hidden";
    }
    var notebookCount;
    if (this.state.notebooks.length === 1) {
      notebookCount = "1 notebook";
    } else {
      notebookCount = this.state.notebooks.length + " notebooks";
    }

    return (
      <ul className={indexClass}>
        <li className="notebook-index-header">
          <p>NOTEBOOKS</p>
          <p>{notebookCount}</p>
          <a className="new-notebook" onClick={this.newNotebook}>New Notebook</a>
        </li>
        <div className="notebook-index-container">
          { typeof this.state.notebooks === "undefined" ? null :
            this.state.notebooks.map(function (notebook) {
              return (
                <NotebooksIndexItem
                  key={notebook.id}
                  notebook={notebook}
                  toggleNotebookIndex={this.props.toggleNotebookIndex} />
              );
            }.bind(this))
          }
        </div>
      </ul>
    );
  }
});