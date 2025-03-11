import { db } from './db';
import { properties, buildings, users } from '@shared/schema';
import { log } from './vite';

async function queryDatabase() {
  try {
    log('Querying properties...', 'query');
    const allProperties = await db.select().from(properties);
    log(`Found ${allProperties.length} properties:`, 'query');
    for (const property of allProperties) {
      log(`Property ID: ${property.id}, Title: ${property.title}`, 'query');
      log(`  Building ID: ${property.buildingId}, Amenities: ${JSON.stringify(property.amenities)}`, 'query');
      log(`  Images: ${JSON.stringify(property.images)}`, 'query');
      log('---', 'query');
    }
    
    log('Querying buildings...', 'query');
    const allBuildings = await db.select().from(buildings);
    log(`Found ${allBuildings.length} buildings:`, 'query');
    for (const building of allBuildings) {
      log(`Building ID: ${building.id}, Name: ${building.name}`, 'query');
      log(`  Address: ${building.address}, Neighborhood: ${building.neighborhood}`, 'query');
      log(`  Amenities: ${JSON.stringify(building.amenities)}`, 'query');
      log('---', 'query');
    }
    
    log('Querying users...', 'query');
    const allUsers = await db.select().from(users);
    log(`Found ${allUsers.length} users:`, 'query');
    for (const user of allUsers) {
      log(`User ID: ${user.id}, Username: ${user.username}`, 'query');
      log(`  Name: ${user.firstName} ${user.lastName}, Type: ${user.userType}`, 'query');
      log(`  Email: ${user.email}`, 'query');
      log('---', 'query');
    }
    
  } catch (error) {
    log(`Error querying database: ${error}`, 'query');
  }
}

queryDatabase();