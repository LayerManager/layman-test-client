import React from 'react'
import {Form} from 'semantic-ui-react'
import PublicationAccessRightsParams from "./PublicationAccessRightsParams";
import FormDropdown from "./FormDropdown";

class PostWorkspaceLayersParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline>
            <label>Data file</label>
            <input name="file" type="file" multiple/>
          </Form.Field>
          <Form.Input
              inline
              name="external_table_uri"
              label='External table connection URI'
              placeholder='External table connection URI'/>
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
            <input name="style" type="file" accept=".sld,.xml,.qml"/>
          </Form.Field>
          <PublicationAccessRightsParams/>
          <FormDropdown
              options={[
                {key: 1, text: 'No value', value: ''},
                {key: 2, text: 'nearest', value: 'nearest'},
                {key: 3, text: 'average', value: 'average'},
                {key: 4, text: 'rms', value: 'rms'},
                {key: 5, text: 'bilinear', value: 'bilinear'},
                {key: 6, text: 'gauss', value: 'gauss'},
                {key: 7, text: 'cubic', value: 'cubic'},
                {key: 8, text: 'cubicspline', value: 'cubicspline'},
                {key: 9, text: 'lanczos', value: 'lanczos'},
                {key: 10, text: 'average_magphase', value: 'average_magphase'},
                {key: 11, text: 'mode', value: 'mode'},
              ]}
              placeholder='Choose resampling method'
              label='Overview resampling'
              additionLabel='Custom value: '
              name="overview_resampling"
          />
          <Form.Input
              inline
              name="time_regex" label='Timeseries time regex'
              placeholder='Timeseries layer time regex'/>
          <Form.Input
              inline
              name="time_regex_format" label='Timeseries time regex format'
              placeholder='Timeseries layer time regex format'/>
        </div>
    );
  }
}

export default PostWorkspaceLayersParams;

