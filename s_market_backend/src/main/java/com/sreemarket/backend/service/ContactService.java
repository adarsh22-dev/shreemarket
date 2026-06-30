package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Contact;
import java.util.List;

public interface ContactService {
    Contact createContact(Contact contact);
    List<Contact> getAllContacts();
    long getContactCount();
}
