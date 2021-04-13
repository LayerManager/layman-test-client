import {Form} from 'semantic-ui-react'
import FormDropdown from './FormDropdown'

class GetPublicationsParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              name="full_text_filter" label='Full-text filter'
              placeholder='Full-text filter'
              style={{'width': '30em'}}
          />
          <Form.Input
              inline
              name="bbox_filter" label='Bounding box filter'
              placeholder='mix,miny,maxx,maxy'
              style={{'width': '45em'}}
          />
          <FormDropdown
              options={[
                {key: 1, text: 'No value', value: ''},
                {key: 2, text: 'Full-text', value: 'full_text'},
                {key: 3, text: 'Title', value: 'title'},
                {key: 4, text: 'Datetime of last change', value: 'last_change'},
                {key: 5, text: 'Bounding box', value: 'bbox'},
              ]}
              placeholder='Choose how to order publications'
              label='Order by'
              additionLabel='Custom value: '
              name="order_by"
          />
          <Form.Input
              inline
              name="ordering_bbox" label='Ordering bounding box'
              placeholder='mix,miny,maxx,maxy'
              style={{'width': '45em'}}
          />
        </div>
    );
  }
}

export default GetPublicationsParams;

