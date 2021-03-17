import {Form} from 'semantic-ui-react'

class FormDropdown extends React.PureComponent {
  state = {}

  handle_value_change = (e, data) => {
    this.setState({
      value: data.value,
    });
  }

  handle_search_change = (e) => {
    this.setState({
      value: e.target.value,
    });
  }

  render() {
    const {options, placeholder, label, additionLabel, name} = this.props;
    const {value} = this.state;
    let dropbox_value, dropbox_search_query;
    if (!!options.find(opt => opt.value === value)) {
      dropbox_value = value;
      dropbox_search_query = '';
    } else {
      dropbox_value = null;
      dropbox_search_query = value;
    }
    return (
        <>
          <Form.Dropdown
              options={options}
              placeholder={placeholder}
              label={label}
              onChange={this.handle_value_change}
              onSearchChange={this.handle_search_change}
              value={dropbox_value}
              search={(options, query) => options.filter(opt => opt.key !== 'addition')}
              searchQuery={dropbox_search_query}
              selection
              inline
              allowAdditions
              additionLabel={additionLabel}
          />
          <input
              hidden
              name={name}
              type="text"
              value={value || ''}
              onChange={() => {
              }}
          />
        </>
    );
  }
}

export default FormDropdown;
