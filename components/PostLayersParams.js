import {Form} from 'semantic-ui-react'
import PublicationAccessRightsParams from "./PublicationAccessRightsParams";

class PostLayersParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline className="mandatory">
            <label>Vector data file</label>
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
          <Form.Field inline>
            <label>Style file</label>
            <input name="style" type="file" accept=".sld,.xml,.qgis"/>
          </Form.Field>
          <PublicationAccessRightsParams/>
        </div>
    );
  }
}

export default PostLayersParams;

