export interface TripMember {
  id: number;
  trip_id: number;
  user_id: number;
  role: string;
  joined_at: Date;
}


export class TripMembersService {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = `${baseUrl}/TripMembers`;
  }

  async getAll(): Promise<TripMember[]> {
    const response = await fetch(this.baseUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to get trip members: ${response.statusText}`);
    }
    
    return response.json();
  }

  async get(id: number): Promise<TripMember> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Trip member with ID ${id} not found`);
      }
      throw new Error(`Failed to get trip member: ${response.statusText}`);
    }
    
    return response.json();
  }

  async addMemberToTrip(
    tripId: number, 
    member: Omit<TripMember, 'id' | 'trip_id' | 'joined_at'> & { joined_at?: string }
  ): Promise<TripMember> {
    const response = await fetch(`${this.baseUrl}/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(member)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Trip with ID ${tripId} not found`);
      }
      throw new Error(`Failed to add member to trip: ${response.statusText}`);
    }
    
    return response.json();
  }

  async update(id: number, member: TripMember): Promise<void> {
    if (id !== member.id) {
      throw new Error('Trip member ID mismatch');
    }
    
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(member)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Trip member with ID ${id} not found`);
      } else if (response.status === 400) {
        throw new Error('Invalid trip member data');
      }
      throw new Error(`Failed to update trip member: ${response.statusText}`);
    }
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Trip member with ID ${id} not found`);
      }
      throw new Error(`Failed to delete trip member: ${response.statusText}`);
    }
  }
}

// Example usage:
/*
// Create an instance of the service
const tripMembersService = new TripMembersService();

// Get all trip members
tripMembersService.getAll()
  .then(members => console.log(members))
  .catch(error => console.error(error));

// Get a specific trip member
tripMembersService.get(1)
  .then(member => console.log(member))
  .catch(error => console.error(error));

// Create a new trip member
const newMember = { name: 'John Doe', email: 'john@example.com' };
tripMembersService.create(newMember)
  .then(createdMember => console.log(createdMember))
  .catch(error => console.error(error));

// Update a trip member
const updatedMember = { id: 1, name: 'Jane Doe', email: 'jane@example.com' };
tripMembersService.update(1, updatedMember)
  .then(() => console.log('Trip member updated successfully'))
  .catch(error => console.error(error));

// Delete a trip member
tripMembersService.delete(1)
  .then(() => console.log('Trip member deleted successfully'))
  .catch(error => console.error(error));
*/