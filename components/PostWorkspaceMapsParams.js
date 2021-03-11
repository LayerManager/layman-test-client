import {Form} from 'semantic-ui-react'
import PublicationAccessRightsParams from "./PublicationAccessRightsParams";

class PostWorkspaceMapsParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline className="mandatory">
            <label>Map file</label>
            <input name="file" type="file" accept=".json"/>
          </Form.Field>
          <Form.Input
              inline
              name="name"
              label='Map name'
              placeholder='Map name'
              value={this.props.mapname}
              onChange={this.props.handleMapnameChange}/>
          <Form.Input
              inline
              name="title"
              label='Map title'
              placeholder='Map title'/>
          <Form.Input
              inline
              name="description" label='Map description'
              placeholder='Map description'/>
          <PublicationAccessRightsParams/>
        </div>
    );
  }
}

export default PostWorkspaceMapsParams;

