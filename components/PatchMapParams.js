import {Form} from 'semantic-ui-react'

class PatchMapParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline>
            <label>Map file</label>
            <input name="file" type="file" accept=".json"/>
          </Form.Field>
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

export default PatchMapParams;

