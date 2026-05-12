import React, { useState, useEffect } from 'react';
import { Table } from './ui';
import * as api from '@/lib/apiService';

const PropertyTracker = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const loadProperties = async () => {
      const data = await api.fetchProperties();
      setProperties(data);
    };
    loadProperties();
  }, []);

  return (
    <div>
      <h1>Property Tracker</h1>
      <Table>
        <thead>
          <tr>
            <th>Property Name</th>
            <th>Location</th>
            <th>Occupancy</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td>{property.name}</td>
              <td>{property.location}</td>
              <td>{property.occupancy}</td>
              <td>{property.revenue}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default PropertyTracker;