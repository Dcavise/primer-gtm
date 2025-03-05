
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  UserRound, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Briefcase, 
  ExternalLink,
  AlertCircle,
  LinkedinIcon,
  Twitter
} from "lucide-react";
import { searchContactsByDomain, HunterContact } from "@/services/contacts-api";
import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export default function FindContactsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [contacts, setContacts] = useState<HunterContact[]>([]);
  const [domainInfo, setDomainInfo] = useState<{
    domain: string;
    organization: string | null;
    location: string | null;
  } | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [seniority, setSeniority] = useState<string>("");
  const [contactType, setContactType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(searchQuery.trim())) {
      toast.error("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setSearchStatus('loading');
    setError(null);

    try {
      const result = await searchContactsByDomain({
        domain: searchQuery.trim(),
        department: department || undefined,
        seniority: seniority || undefined,
        type: (contactType as "personal" | "generic" | undefined) || undefined,
      });

      if (result) {
        setContacts(result.emails || []);
        
        // Format location
        const locationParts = [result.city, result.state, result.country]
          .filter(Boolean)
          .join(", ");
        
        setDomainInfo({
          domain: result.domain,
          organization: result.organization,
          location: locationParts || null
        });
        
        setSearchStatus('success');
      } else {
        setContacts([]);
        setDomainInfo(null);
        setSearchStatus('error');
        setError("No results found");
      }
    } catch (err) {
      console.error("Error searching contacts:", err);
      setSearchStatus('error');
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to search contacts");
    }
  };

  const renderConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500">High</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
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
            Search and find business contacts by domain name
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-5xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Business Contacts</CardTitle>
            <CardDescription>
              Enter a company domain name to find contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Domain name (e.g., stripe.com)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searchStatus === 'loading'}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Any department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any department</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="seniority">Seniority</Label>
                  <Select value={seniority} onValueChange={setSeniority}>
                    <SelectTrigger id="seniority">
                      <SelectValue placeholder="Any seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any seniority</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Contact Type</Label>
                  <Select value={contactType} onValueChange={setContactType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="generic">Generic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchStatus === 'loading' && (
          <LoadingState message="Searching for contacts..." />
        )}

        {searchStatus === 'success' && contacts.length > 0 && domainInfo && (
          <>
            <div className="mb-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-medium mb-2">{domainInfo.organization || domainInfo.domain}</h2>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {domainInfo.domain}
                      </p>
                      {domainInfo.location && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {domainInfo.location}
                        </p>
                      )}
                    </div>
                    <div>
                      <Badge className="bg-blue-500">{contacts.length} contacts found</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <UserRound className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg">
                            {contact.first_name && contact.last_name 
                              ? `${contact.first_name} ${contact.last_name}` 
                              : contact.value}
                          </h3>
                          <div>
                            {renderConfidenceLabel(contact.confidence)}
                            {contact.type === "generic" && (
                              <Badge variant="outline" className="ml-2">Generic</Badge>
                            )}
                          </div>
                        </div>
                        
                        {contact.position && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span>{contact.position}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          <a href={`mailto:${contact.value}`} className="text-blue-500 hover:underline">{contact.value}</a>
                        </div>
                        
                        {contact.phone_number && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{contact.phone_number}</span>
                          </div>
                        )}
                        
                        {(contact.linkedin || contact.twitter) && (
                          <div className="flex gap-2 mt-2">
                            {contact.linkedin && (
                              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600">
                                <LinkedinIcon className="h-5 w-5" />
                              </a>
                            )}
                            {contact.twitter && (
                              <a href={contact.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400">
                                <Twitter className="h-5 w-5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {contact.sources && contact.sources.length > 0 && (
                    <CardFooter className="pt-0 border-t px-6 py-3">
                      <div className="w-full text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Found on {contact.sources.length} {contact.sources.length === 1 ? 'source' : 'sources'}
                        </span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {searchStatus === 'success' && contacts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                We couldn't find any contacts for the domain "{searchQuery}". Try another domain or refine your search filters.
              </p>
            </CardContent>
          </Card>
        )}

        {searchStatus === 'error' && (
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error searching contacts</h3>
              <p className="text-muted-foreground">
                {error || "An error occurred while searching for contacts. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
