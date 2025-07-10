import React from 'react'
import {Form} from 'semantic-ui-react'

class UuidParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              className="mandatory"
              name="uuid"
              label={this.props.label}
              placeholder={this.props.placeholder}
              value={this.props.uuid}
              onChange={this.props.handleUuidChange}/>
        </div>
    );
  }
}

export default UuidParams; 