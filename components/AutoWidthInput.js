class AutoWidthInput extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue || null,
    };
    this.handle_value_change = this.handle_value_change.bind(this);
  }

  handle_value_change = (e) => {
    this.setState({
      value: e.target.value,
    });
  }

  render() {
    const {name, style} = this.props;
    const value = this.state.value || '';
    const style_width = `${Math.max(value.length, 10)}ch`;
    return (
        <input
            name={name}
            type="text"
            value={value}
            onChange={this.handle_value_change}
            style={{
              ...style,
              width: style_width,
            }}
        />
    );
  }
}

export default AutoWidthInput;
