import React from 'react'
import {Form} from 'semantic-ui-react'

class WorkspacePathParams extends React.PureComponent {

  render() {
    const mandatory = this.props.mandatory !== false;
    return (
        <Form.Input
            inline
            className={mandatory ? 'mandatory' : undefined}
            name="Workspace"
            label='Workspace name'
            placeholder='Workspace name'
            value={this.props.workspace}
            onChange={this.props.handleWorkspaceChange}/>
    );
  }
}

export default WorkspacePathParams;

