import React from 'react';
import './Select.css';

const Select = ({ label, error, options, ...props }) => {
        return ( <
                div className = "select-group" > {
                    label && < label htmlFor = { props.id || props.name } > { label } < /label>} <
                    select
                    className = { `select-input ${error ? 'error' : ''}` } {...props } >
                    {
                        options && options.map(option => ( <
                            option key = { option.value }
                            value = { option.value } > { option.label } <
                            /option>
                        ))
                    } <
                    /select> {
                        error && < span className = "error-message" > { error } < /span>} <
                            /div>
                    );
                };

                export default Select;