import {Form} from 'semantic-ui-react'

class PostMapsParams extends React.PureComponent {

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
              onChange={this.props.onMapnameChange}/>
          <Form.Input
              inline
              name="title"
              label='Map title'
              placeholder='Map title'/>
          <Form.Input
              inline
              name="description" label='Map description'
              placeholder='Map description'/>
        </div>
    );
  }
}

export default PostMapsParams;

