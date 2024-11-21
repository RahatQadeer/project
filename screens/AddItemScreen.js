
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, remove } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAktu08t0bLiCjwymRCy8G8rqYZF4GbUbU",
  authDomain: "se-5-project.firebaseapp.com",
  projectId: "se-5-project",
  storageBucket: "se-5-project.firebasestorage.app",
  messagingSenderId: "402826773495",
  appId: "1:402826773495:web:50853298842b20599a24f2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function AddItemScreen() {
  const [allItems, setAllItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    loadAllItems();
  }, []);

  const loadAllItems = () => {
    const itemsRef = ref(database, 'items/');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsArray = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
        }));
        setAllItems(itemsArray);
      } else {
        setAllItems([]);
      }
    });
  };

  const saveNotification = async (message) => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      notifications.unshift(message); // Add new notification to the start of the list
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification: ', error);
    }
  };

  const addItem = async () => {
    if (itemName.trim() && itemQuantity.trim()) {
      const newItem = {
        name: itemName,
        quantity: itemQuantity,
      };

      try {
        await push(ref(database, 'items/'), newItem);
        setItemName('');
        setItemQuantity('');
        setModalVisible(false);
        await saveNotification(`Item "${itemName}" was added.`);
        Alert.alert('Success', 'Item added successfully!');
      } catch (error) {
        console.error('Error adding item: ', error);
      }
    }
  };

  const updateItem = async () => {
    if (itemName.trim() && itemQuantity.trim() && selectedItemId) {
      const itemRef = ref(database, `items/${selectedItemId}`);
      try {
        await update(itemRef, { name: itemName, quantity: itemQuantity });
        setItemName('');
        setItemQuantity('');
        setSelectedItemId(null);
        setEditMode(false);
        setModalVisible(false);
        await saveNotification(`Item "${itemName}" was updated.`);
        Alert.alert('Success', 'Item updated successfully!');
      } catch (error) {
        console.error('Error updating item: ', error);
      }
    }
  };

  const deleteItem = async (itemId) => {
    const itemRef = ref(database, `items/${itemId}`);
    const itemToDelete = allItems.find((item) => item.id === itemId);
    try {
      await remove(itemRef);
      await saveNotification(`Item "${itemToDelete?.name}" was deleted.`);
      Alert.alert('Success', 'Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item: ', error);
    }
  };

  const openEditModal = (item) => {
    setItemName(item.name);
    setItemQuantity(item.quantity);
    setSelectedItemId(item.id);
    setEditMode(true);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total Items: {allItems.length}</Text>
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.allItemsItem}>
              <Text>
                {item.name} - {item.quantity}
              </Text>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditMode(false);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editMode ? 'Update Item' : 'Add New Item'}</Text>
            <TextInput
              placeholder="Item Name"
              value={itemName}
              onChangeText={setItemName}
              style={styles.input}
            />
            <TextInput
              placeholder="Quantity"
              value={itemQuantity}
              onChangeText={setItemQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={editMode ? updateItem : addItem}
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddButtonText}>{editMode ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#ffe6e6', paddingTop: 110 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#ff99cc',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    borderRadius: 10,
  },
  allItemsItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: { color: '#1e90ff', marginLeft: 10 },
  deleteText: { color: '#ff6347', marginLeft: 10 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ff99cc',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 8, marginBottom: 10 },
  modalAddButton: { backgroundColor: '#ff99cc', padding: 10, borderRadius: 8, alignItems: 'center' },
  modalAddButtonText: { color: '#fff', fontSize: 16 },
});
