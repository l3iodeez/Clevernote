var NoteForm = React.createClass({
  mixins: [React.addons.LinkedStateMixin],
  getInitialState: function() {
    var id = this.props.note ? this.props.note.id : "";
    var title = this.props.note ? this.props.note.title : "";
    var body = this.props.note ? this.props.note.body : "";
    var is_archived = this.props.note ? this.props.note.is_archived : false;

    return {
      id: id,
      title: title,
      body: body,
      is_archived: is_archived,
    };
  },
  componentWillReceiveProps: function (newProps) {
    var title = newProps.note ? newProps.note.title : "";
    var body = newProps.note ? newProps.note.body : "";
    this.setState({
      title: title,
      body: body
    });
  },
  handleSubmit: function (e) {
    e.preventDefault();
    if (this.state.title.length === 0 || this.state.body.length === 0 ) {
      return;
    }
    if (this.props.note) {
      var note = {
        id: this.props.note.id,
        title: this.state.title,
        body: this.state.body,
        is_archived: this.state.is_archived
      };
      ApiUtil.editNote(note);
    } else {
      ApiUtil.createNote({
        title: this.state.title,
        body: this.state.body,
      });
    }
    this.setState({
      id: "",
      title: "",
      body: "",
      is_archived: ""
    });
  },

  updateAttribute: function(attr, e) {
    this.state[attr] = e.currentTarget.value;
    this.forceUpdate();
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
  titlePlaceholder: function () {
    if (this.state.title === "" ) {
      return "Enter a title...";
    } else {
      return "";
    }
  },
  bodyPlaceholder: function () {
    if (this.state.body === "" ) {
      return "Enter body text...";
    } else {
      return "";
    }
  },
  render: function() {

    return (
      <form className="note-form" onSubmit={this.handleSubmit}>
        <button>Save note</button>
        <button onClick={this.newNote}>New note</button>
        <br />
        <label>Note Title
          <br />
          <input type="text" placeholder={this.titlePlaceholder()} name="title" valueLink={this.linkState("title")} />
        </label>
        <br />
        <label>
          <br />
          <textarea name="body" placeholder={this.bodyPlaceholder()} value={this.state.body} onChange={this.updateAttribute.bind(this, "body")} ></textarea>
        </label>
        <br />

      </form>
    );
  }
});
