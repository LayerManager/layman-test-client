import React from 'react'
import {Form} from 'semantic-ui-react'
import WorkspacePathParams from "./WorkspacePathParams";

class WorkspaceMapPathParams extends React.PureComponent {

  render() {
    return (
        <div>
          <WorkspacePathParams workspace={this.props.workspace} handleWorkspaceChange={this.props.handleWorkspaceChange}/>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Map name'
              placeholder='Map name'
              value={this.props.mapname}
              onChange={this.props.handleMapnameChange}/>
        </div>
    );
  }
}

export default WorkspaceMapPathParams;

