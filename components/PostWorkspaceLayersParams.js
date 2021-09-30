import {Form} from 'semantic-ui-react'
import PublicationAccessRightsParams from "./PublicationAccessRightsParams";
import StyleParams from "./StyleParams";

class PostWorkspaceLayersParams extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div>
          <Form.Field inline className="mandatory">
            <label>Data file</label>
            <input name="file" type="file" multiple/>
          </Form.Field>
          <Form.Input
              inline
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.handleLayernameChange}/>
          <Form.Input
              inline
              name="title"
              label='Layer title'
              placeholder='Layer title'/>
          <Form.Input
              inline
              name="description" label='Layer description'
              placeholder='Layer description'/>
          <Form.Input
              inline
              name="crs"
              label='CRS'
              placeholder='CRS'/>
          <StyleParams url_prefix = {this.props.url_prefix} />
          <PublicationAccessRightsParams/>
        </div>
    );
  }
}

export default PostWorkspaceLayersParams;

