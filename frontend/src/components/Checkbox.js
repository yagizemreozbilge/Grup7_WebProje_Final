import React from 'react';
import './Checkbox.css';

const Checkbox = ({ label, error, ...props }) => {
        return ( <
            div className = "checkbox-group" >
            <
            label className = "checkbox-label" >
            <
            input type = "checkbox"
            className = { `checkbox-input ${error ? 'error' : ''}` } {...props }
            /> <
            span className = "checkbox-text" > { label } < /span> <
            /label> {
                error && < span className = "error-message" > { error } < /span>} <
                    /div>
            );
        };

        export default Checkbox;