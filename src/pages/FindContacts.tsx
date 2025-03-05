
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserRound, Phone, Mail, MapPin } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
};

// Sample contacts data
const sampleContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA"
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "(555) 234-5678",
    location: "New York, NY"
  },
  {
    id: "3",
    name: "Jessica Williams",
    email: "jessica.williams@example.com",
    phone: "(555) 345-6789",
    location: "Chicago, IL"
  },
  {
    id: "4",
    name: "David Miller",
    email: "david.miller@example.com",
    phone: "(555) 456-7890",
    location: "Austin, TX"
  }
];

export default function FindContactsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(sampleContacts);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredContacts(sampleContacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = sampleContacts.filter(
      contact => 
        contact.name.toLowerCase().includes(query) || 
        contact.email.toLowerCase().includes(query) || 
        contact.location.toLowerCase().includes(query)
    );
    
    setFilteredContacts(results);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Find Contacts</h1>
            <Navbar />
          </div>
          <p className="text-white/80 mt-2">
            Search and manage your contact directory
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-5xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Contacts</CardTitle>
            <CardDescription>
              Find contacts by name, email, or location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <UserRound className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-lg">{contact.name}</h3>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{contact.email}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{contact.phone}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{contact.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="md:col-span-2 p-8 text-center">
              <p className="text-muted-foreground">No contacts found. Try a different search term.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
