package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Address;
import com.sreemarket.backend.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    public List<Address> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    public List<Address> getAddressesByUserIdAndRoleId(Long userId, Long roleId) {
        return addressRepository.findByUserIdAndRoleId(userId, roleId);
    }

    public Optional<Address> getAddressByIdAndUserId(Long id, Long userId) {
        return addressRepository.findByIdAndUserId(id, userId);
    }

    @Transactional
    public Address createAddress(Address address) {
        // If this is the user's first address, force it to be default
        List<Address> existingAddresses = addressRepository.findByUserId(address.getUserId());
        if (existingAddresses.isEmpty()) {
            address.setDefaultAddress(true);
        } else if (address.isDefaultAddress()) {
            // Unset current default addresses for this user
            unsetOtherDefaults(address.getUserId());
        } else {
            // Null check
            address.setDefaultAddress(false);
        }

        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(Long id, Long userId, Address updatedAddress) {
        Optional<Address> existingOpt = addressRepository.findByIdAndUserId(id, userId);

        if (existingOpt.isPresent()) {
            Address existing = existingOpt.get();

            // Handle default logic
            if (updatedAddress.isDefaultAddress() && !existing.isDefaultAddress()) {
                unsetOtherDefaults(userId);
            }

            // Copy properties
            existing.setTitle(updatedAddress.getTitle());
            existing.setFullName(updatedAddress.getFullName());
            existing.setPhoneNumber(updatedAddress.getPhoneNumber());
            existing.setStreetAddress(updatedAddress.getStreetAddress());
            existing.setCity(updatedAddress.getCity());
            existing.setState(updatedAddress.getState());
            existing.setZipCode(updatedAddress.getZipCode());
            existing.setCountry(updatedAddress.getCountry());
            existing.setDefaultAddress(updatedAddress.isDefaultAddress());

            return addressRepository.save(existing);
        }

        throw new RuntimeException("Address not found or does not belong to user");
    }

    @Transactional
    public void deleteAddress(Long id, Long userId) {
        Optional<Address> addressOpt = addressRepository.findByIdAndUserId(id, userId);

        if (addressOpt.isPresent()) {
            Address address = addressOpt.get();
            boolean wasDefault = address.isDefaultAddress();

            addressRepository.delete(address);

            // If the default address was deleted, make another address the new default if
            // one exists
            if (wasDefault) {
                List<Address> remainingAddresses = addressRepository.findByUserId(userId);
                if (!remainingAddresses.isEmpty()) {
                    Address newDefault = remainingAddresses.get(0);
                    newDefault.setDefaultAddress(true);
                    addressRepository.save(newDefault);
                }
            }
        } else {
            throw new RuntimeException("Address not found or does not belong to user");
        }
    }

    @Transactional
    public Address setAddressAsDefault(Long id, Long userId) {
        Optional<Address> existingOpt = addressRepository.findByIdAndUserId(id, userId);
        if (existingOpt.isPresent()) {
            unsetOtherDefaults(userId);
            Address address = existingOpt.get();
            address.setDefaultAddress(true);
            return addressRepository.save(address);
        }
        throw new RuntimeException("Address not found or does not belong to user");
    }

    private void unsetOtherDefaults(Long userId) {
        List<Address> defaultAddresses = addressRepository.findByUserIdAndDefaultAddressTrue(userId);
        for (Address addr : defaultAddresses) {
            addr.setDefaultAddress(false);
            addressRepository.save(addr);
        }
    }
}
