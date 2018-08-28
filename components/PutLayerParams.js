import {Form} from 'semantic-ui-react'

class PutLayerParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.onLayernameChange}/>
          <Form.Field inline>
            <label>Vector data file</label>
            <input name="file" type="file" accept=".geojson,.json" multiple/>
          </Form.Field>
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
            <label>SLD style</label>
            <input name="sld" type="file" accept=".sld,.xml"/>
          </Form.Field>
        </div>
    );
  }
}

export default PutLayerParams;

